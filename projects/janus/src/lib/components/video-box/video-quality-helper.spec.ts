import * as moment from 'moment';
import * as Factory from 'factory.ts';

import { VideoQualityHelper, VideoStats, VideoRunRecord } from './video-quality-helper';

const VideoRunRecordFactory = Factory.Sync.makeFactory<VideoRunRecord>({
  ended: moment('2013-01-01T00:00:00.000'),
  duration: 5,
});

const VideoStatsFactory = Factory.Sync.makeFactory<VideoStats>({
  started: moment('2013-01-01T00:00:00.000'),
  runs: [],
  errors: [],
});

describe('VideoQualityHelper', () => {
  let instance: VideoQualityHelper;
  let timestamp: moment.Moment;

  beforeEach(() => {
    instance = new VideoQualityHelper(3);
    instance.noise = 1;   // Eliminate noise for testing
    timestamp = moment.utc('2000-01-01T00:00:00');
    jasmine.clock().mockDate(timestamp.toDate());
  });

  it('should create an instance', () => {
    expect(instance).toBeTruthy();
  });

  describe('logStreamSuccess', () => {
    it('should log the current state -- first time', () => {
      instance.logStreamSuccess(0);
      expect(instance.streams[0].started.toString()).toEqual(timestamp.toString());
      expect(instance.streams[0].runs).toEqual([]);
      expect(instance.streams[0].errors).toEqual([]);
    });

    it('should log the current state -- second time', () => {
      instance.streams[0] = {
        started: timestamp,
        runs: [],
        errors: [],
      };
      instance.logStreamSuccess(0);
      expect(instance.streams[0].started).toEqual(timestamp);
      expect(instance.streams[0].runs).toEqual([]);
      expect(instance.streams[0].errors).toEqual([]);
    });

    it('should log the current state -- was not running and has previous runs', () => {
      const lastError = moment.utc();
      instance.streams[0] = VideoStatsFactory.build({
        started: null,
        runs: [VideoRunRecordFactory.build()],
        errors: [VideoRunRecordFactory.build()],
      });
      instance.logStreamSuccess(0);
      expect(instance.streams[0].started.toString()).toEqual(timestamp.toString());
    });
  });

  describe('streamError', () => {
    it('should log an error -- first error', () => {
      instance.streams[0].started = moment(timestamp).subtract(1, 's');
      instance.streamError(0);

      expect(instance.streams[0].errors[0].ended.toString()).toEqual(timestamp.toString());
      expect(instance.streams[0].errors[0].duration).toEqual(1000);
      expect(instance.streams[0].runs).toEqual([]);
      expect(instance.streams[0].started).toEqual(null);
    });

    it('should log an error -- second error', () => {
      const run = VideoRunRecordFactory.build();
      const error = VideoRunRecordFactory.build();
      instance.streams[0].started = moment(timestamp).subtract(1, 's');
      instance.streams[0].runs = [run];
      instance.streams[0].errors = [error];

      instance.streamError(0);

      expect(instance.streams[0].errors[0]).toEqual(error);
      expect(instance.streams[0].errors[1].ended.toString()).toEqual(timestamp.toString());
      expect(instance.streams[0].errors[1].duration).toEqual(1000);
      expect(instance.streams[0].runs).toEqual([run]);
      expect(instance.streams[0].started).toEqual(null);
    });
  });

  describe('streamEnd', () => {
    it('should log a success -- first run', () => {
      instance.streams[0].started = moment(timestamp).subtract(1, 's');
      instance.streamEnd(0);

      expect(instance.streams[0].runs[0].ended.toString()).toEqual(timestamp.toString());
      expect(instance.streams[0].runs[0].duration).toEqual(1000);
      expect(instance.streams[0].errors).toEqual([]);
      expect(instance.streams[0].started).toEqual(null);
    });

    it('should log a success -- second run', () => {
      const run = VideoRunRecordFactory.build();
      const error = VideoRunRecordFactory.build();
      instance.streams[0].started = moment(timestamp).subtract(1, 's');
      instance.streams[0].runs = [run];
      instance.streams[0].errors = [error];

      instance.streamEnd(0);

      expect(instance.streams[0].runs[0]).toEqual(run);
      expect(instance.streams[0].runs[1].ended.toString()).toEqual(timestamp.toString());
      expect(instance.streams[0].runs[1].duration).toEqual(1000);
      expect(instance.streams[0].errors).toEqual([error]);
      expect(instance.streams[0].started).toEqual(null);
    });
  });

  describe('testUpgrade', () => {
    it('should recommend upgrade -- no previous errors, current stream old enough', () => {
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).subtract(1, 's');

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(1);
    });

    it('should not recommend upgrade -- no previous errors, current stream not old enough', () => {
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).add(1, 's');

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(0);
    });

    it('should recommend upgrade -- one previous error old enough', () => {
      const errorTimestamp = moment(timestamp).subtract(instance.retryTimeoutBase).subtract(1, 's');
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).subtract(1, 's');
      instance.streams[1].errors = [
        VideoRunRecordFactory.build({ended: errorTimestamp})
      ];

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(1);
    });

    it('should not recommend upgrade -- one previous error not old enough', () => {
      const errorTimestamp = moment(timestamp).subtract(instance.retryTimeoutBase).add(1, 's');
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).subtract(1, 's');
      instance.streams[1].errors = [
        VideoRunRecordFactory.build({ended: errorTimestamp})
      ];

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(0);
    });

    it('should recommend upgrade -- two previous errors old enough', () => {
      const errorTimestamp = moment(timestamp)
        .subtract(instance.retryTimeoutBase)
        .subtract(instance.retryTimeoutBase)
        .subtract(1, 's');
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).subtract(1, 's');
      instance.streams[1].errors = [
        VideoRunRecordFactory.build({ended: moment('1990-01-01')}),
        VideoRunRecordFactory.build({ended: errorTimestamp})
      ];

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(1);
    });

    it('should not recommend upgrade -- two previous error not old enough', () => {
      const errorTimestamp = moment(timestamp).subtract(instance.retryTimeoutBase).subtract(1, 's');
      instance.streams[0].started = moment(timestamp).subtract(instance.upgradeTimeout).subtract(1, 's');
      instance.streams[1].errors = [
        VideoRunRecordFactory.build(),
        VideoRunRecordFactory.build({ended: errorTimestamp})
      ];

      const newStream = instance.testUpgrade(0);
      expect(newStream).toEqual(0);
    });
  });
});
