import * as moment from 'moment';

/** @internal */
export interface VideoRunRecord {
  ended: moment.Moment;
  duration: number;   // Length of stream ending
}

/** @internal */
export interface VideoStats {
  started: moment.Moment;
  runs: VideoRunRecord[];
  errors: VideoRunRecord[];
}

/** @internal */
export class VideoQualityHelper {
  streams: { [id: number]: VideoStats } = {};

  private numStreams: number;
  noise: number;
  upgradeTimeout = moment.duration(5, 'seconds');
  retryTimeoutBase = moment.duration(2, 'minutes');

  constructor(numStreams: number) {
    this.numStreams = numStreams;
    for (let ii = 0; ii < numStreams; ii++) {
      this.streams[ii] = {
        started: null,
        runs: [],
        errors: [],
      };
    }

    // Will be a number between 0.5 and 1.5
    this.noise = Math.random() + .5;
  }

  logStreamSuccess(substream: number): void {
    // Log the current state to our substreamPerformance structure

    if (!this.streams[substream].started) {
      this.streams[substream].started = moment.utc();
    }
  }

  testUpgrade(substream): number {
    // We upgrade if we've been on the current stream for a consecutive upgradeTimeout period and
    // It's been at least retryTimeoutBase ** numErrors since the last error on the higher stream
    // or there has never been an error at the higher stream

    const streamDuration = moment.duration(moment.utc().diff(this.streams[substream].started));
    if (streamDuration < this.upgradeTimeout) {
      return substream;
    }

    const numErrors = this.streams[substream + 1].errors.length;
    if (numErrors === 0) {
      // Never had an error at the higher substream. Let's give it a try
      return substream + 1;
    } else {
      const millisecondsSinceLastError = moment.duration(
        moment.utc().diff(this.streams[substream + 1].errors[numErrors - 1].ended)
      ).asMilliseconds();
      const threshold = this.retryTimeoutBase.asMilliseconds() * (2 ** (numErrors - 1)) * this.noise;
      if (millisecondsSinceLastError > threshold) {
        return substream + 1;
      }
    }
    return substream;
  }

  ping(substream: number): number {
    // ping that the given substream is running well. Returns the recommended stream to use

    if (substream >= this.numStreams) {
      throw new Error('substream too large: ' + substream.toString());
    }

    this.logStreamSuccess(substream);

    if (substream === this.numStreams - 1) {
      return substream;
    }

    return this.testUpgrade(substream);
  }

  _createVideoRunRecord(started: moment.Moment): VideoRunRecord {
    const now = moment.utc();
    const duration = moment.duration(
      now.diff(started)
    ).asMilliseconds();

    return {
      ended: now,
      duration,
    };
  }

  streamError(substream: number): void {
    // Mark a stream as ending in error
    this.streams[substream].errors.push(
      this._createVideoRunRecord(this.streams[substream].started)
    );
    this.streams[substream].started = null;
  }

  streamEnd(substream: number): void {
    // Mark a stream as ending with success
    this.streams[substream].runs.push(
      this._createVideoRunRecord(this.streams[substream].started)
    );
    this.streams[substream].started = null;
  }
}
