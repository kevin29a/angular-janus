import * as moment from 'moment';

import * as fromJanus from './janus.reducers';
import * as fromActions from '../actions/janus.actions';
import * as fromServiceModels from '../../models/janus-server.models';
import { RemoteFeedState, RoomInfo, RoomInfoState, PublishState } from '../../models/janus.models';
import { RemoteFeedFactory, RoomInfoFactory } from '../../factories/janus.factories';


describe('JanusReducer', () => {
  let initialState: fromJanus.VideoroomState;

  beforeEach(() => {
    initialState = fromJanus.initialState;
  });

  describe('Initialize', () => {
    it('should return to a default initial state upon an init', () => {
      const action = new fromActions.InitializeJanus({iceServers: [], janusServer: {wsUrl: '', httpUrl: ''}});

      const incomingState = {
        ...initialState,
        roomInfo: RoomInfoFactory.build({state: RoomInfoState.joined}),
        remoteFeeds: {
          123: RemoteFeedFactory.build()
        }
      };

      const expectedState = {
        ...initialState,
        roomInfo: {
          ...initialState.roomInfo,
            state: RoomInfoState.initializing,
        }
      };

      const state = fromJanus.reducer(incomingState, action);
      expect(state).toEqual(expectedState);
    });
  });

  describe('Attach', () => {
    it('should move to state "attaching" upon an attach message', () => {
      const action = new fromActions.AttachVideoRoom('url');

      const incomingState = {
        ...initialState,
        roomInfo: RoomInfoFactory.build({state: RoomInfoState.initialized}),
      };

      const expectedState = {
        ...initialState,
        roomInfo: {
          ...incomingState.roomInfo,
          state: RoomInfoState.attaching,
        }
      };

      const state = fromJanus.reducer(incomingState, action);
      expect(state).toEqual(expectedState);
    });

    it('should move to state "attach_fail" upon an attach failure message', () => {
      const action = new fromActions.AttachVideoRoomFail({});

      const incomingState = {
        ...initialState,
        roomInfo: RoomInfoFactory.build({state: RoomInfoState.attaching}),
      };

      const expectedState = {
        ...initialState,
        roomInfo: {
          ...incomingState.roomInfo,
          state: RoomInfoState.attach_failed,
        }
      };

      const state = fromJanus.reducer(incomingState, action);
      expect(state).toEqual(expectedState);
    });
  });

  describe('undefined action', () => {
    it('should return the default state', () => {
      const action = {} as any;
      const state = fromJanus.reducer(undefined, action);

      expect(state).toBe(initialState);
    });
  });

  describe('OnMessage', () => {
    it('should dispatch a joined message correctly -- no publishers', () => {
      const msg: fromServiceModels.JanusMessage = {
        videoroom: 'joined',
        room: '1234',
        description: 'Demo Room',
        id: 5532111755685721,
        private_id: 2985971215,
        publishers: []
      };
      const payload = {
        message: 'message',
        payload: { msg },
      };
      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      const expectedRoomInfo = RoomInfoFactory.build({
        state: RoomInfoState.joined,
        id: '1234',
        description: 'Demo Room',
        otherRoomId: 5532111755685721,
        privateId: 2985971215,
        localStreamId: null,
        publishState: PublishState.ready,
      });

      expect(state.roomInfo).toEqual(expectedRoomInfo);
      expect(state.remoteFeeds).toEqual({});
    });

    it('should dispatch a joined message correctly -- includes a publisher', () => {
      const publisher: fromServiceModels.Pub = {
        id: '123',
        display: 'jt',
        audio_codec: 'audio',
        video_codec: 'video',
      };

      const msg: fromServiceModels.JanusMessage = {
        videoroom: 'joined',
        room: '1234',
        description: 'Demo Room',
        id: 5532111755685721,
        private_id: 2985971215,
        publishers: [publisher],
      };
      const payload = {
        message: 'message',
        payload: { msg },
      };
      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      const expectedRemoteFeed = RemoteFeedFactory.build({
        streamId: null,
        displayName: 'jt',
        id: '123',
        audio_codec: 'audio',
        video_codec: 'video',
      });

      const expectedRoomInfo = RoomInfoFactory.build({
        state: RoomInfoState.joined,
        id: '1234',
        description: 'Demo Room',
        otherRoomId: 5532111755685721,
        privateId: 2985971215,
        localStreamId: null,
        publishState: PublishState.ready,
        muted: false
      });

      expect(state.roomInfo).toEqual(expectedRoomInfo);
      expect(state.remoteFeeds).toEqual({123: expectedRemoteFeed});
    });

    it('should dispatch a joined message correctly -- includes a publisher and already had remoteFeeds', () => {
      const newPublisher: fromServiceModels.Pub = {
        id: '789',
        display: 'kt',
        audio_codec: 'audio789',
        video_codec: 'video789',
      };

      const existingPublisher: fromServiceModels.Pub = {
        id: '123',
        display: 'jt',
        audio_codec: 'audio123',
        video_codec: 'video123',
      };

      const msg: fromServiceModels.JanusMessage = {
        videoroom: 'joined',
        room: '1234',
        description: 'Demo Room',
        id: 5532111755685721,
        private_id: 2985971215,
        publishers: [newPublisher, existingPublisher],
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({state: RemoteFeedState.attached}),
          456: RemoteFeedFactory.build({state: RemoteFeedState.attached}),
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      const expectedRemoteFeeds = {
        123: {
          ...incomingState.remoteFeeds['123'],
          displayName: 'jt',
        },
        456: incomingState.remoteFeeds['456'],
        789: RemoteFeedFactory.build({
          streamId: null,
          id: '789',
          displayName: 'kt',
          audio_codec: 'audio789',
          video_codec: 'video789',
        })
      };
      expect(state.roomInfo.id).toEqual('1234');
      expect(state.remoteFeeds).toEqual(expectedRemoteFeeds);
    });

    it('should add any new publishers found in an "event" message', () => {
      const newPublisher: fromServiceModels.Pub = {
        id: '789',
        display: 'kt',
        audio_codec: 'audio789',
        video_codec: 'video789',
        talking: false
      };

      const msg = {
        videoroom: 'event',
        room: '1234',
        publishers: [newPublisher]
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({state: RemoteFeedState.attached})
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      const expectedRemoteFeeds = {
        ...incomingState.remoteFeeds,
        789: RemoteFeedFactory.build({
          streamId: null,
          currentSubstream: 0,
          id: '789',
          displayName: 'kt',
          audio_codec: 'audio789',
          video_codec: 'video789',
        })
      };
      expect(state.remoteFeeds).toEqual(expectedRemoteFeeds);
    });

    it('should remove "unpublished" publishers found in an "event" message', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        unpublished: '123',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build(),
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds).toEqual({});
    });

    it('should remove "unpublished" publishers found in an "event" message -- publisher does not exist', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        unpublished: '123',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          456: RemoteFeedFactory.build(),
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds).toEqual(incomingState.remoteFeeds);
    });

    it('should update state on remote feed upon attach', () => {
      const msg = {
        videoroom: 'attached',
        room: '1234',
        id: '123',
        display: 'afs'
      };

      const payload = {
        message: '[remote] message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({state: RemoteFeedState.attaching}),
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      const expectedRemoteFeeds = {
        ...incomingState.remoteFeeds,
        123: {
          ...incomingState.remoteFeeds['123'],
          state: RemoteFeedState.attached,
        }
      };

      expect(state.remoteFeeds).toEqual(expectedRemoteFeeds);
    });

    it('should update state on remote feed upon attach -- feed does not exist', () => {
      const msg = {
        videoroom: 'attached',
        room: '1234',
        id: 999,
        display: 'afs'
      };

      const payload = {
        message: '[remote] message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({id: '123', state: RemoteFeedState.attaching}),
        },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state).toEqual(incomingState);
    });

    it('should update substream of remote feed', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        substream: 2,
      };

      const payload = {
        message: '[remote] message',
        payload: {
          feed: RemoteFeedFactory.build({id: '123'}),
          msg
        },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({
            id: '123',
            state: RemoteFeedState.ready,
            currentSubstream: 0,
          }),
        },
      };

      const expectedRemoteFeed = {
        ...incomingState.remoteFeeds['123'],
        currentSubstream: 2,
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);
      expect(state.remoteFeeds['123']).toEqual(expectedRemoteFeed);
    });

    it('should update substream of remote feed -- feed does not exist', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        substream: 2,
      };

      const payload = {
        message: '[remote] message',
        payload: {
          feed: RemoteFeedFactory.build({id: '123'}),
          msg
        },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          456: RemoteFeedFactory.build(),
        },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state).toEqual(incomingState);
    });

    it('should read a configured ok message', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        configured: 'ok',
        audio_codec: 'opus',
        video_codec: 'vp8'
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.roomInfo.publishState).toEqual(PublishState.publishing);
    });

    it('should read a configured error message', () => {
      const msg = {
        videoroom: 'event',
        error_code: 432,
        error: 'Maximum number of publishers (1) already reached'
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.roomInfo.publishState).toEqual(PublishState.error);
      expect(state.roomInfo.errorCode).toEqual(432);
    });

    it('should process a leaving record right', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        leaving: '123',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build(),
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds).toEqual({});
    });

    it('should process a leaving record right -- feed does not exist', () => {
      const msg = {
        videoroom: 'event',
        room: '1234',
        leaving: '123',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.remoteFeeds).toEqual({});
    });

    it('should process a kicked message right', () => {
      const msg = {
        leaving: 'ok',
        reason: 'kicked',
        room: 'RHWYhdovEA7DFDwkC0O1Rw',
        videoroom: 'event',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.roomInfo.errorCode).toEqual(fromServiceModels.CustomErrors.kicked);
    });

    it('should process a talking message -- feed does not exist', () => {
      const msg = {
        'audio-level-dBov-avg': 96.95999908447266,
        id: 'VAMbowLI7LdzC73Obt2FSaMpAvk1',
        room: '1234',
        videoroom: 'talking',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.remoteFeeds).toEqual({});
    });

    it('should process a talking message', () => {
      const msg = {
        'audio-level-dBov-avg': 96.95,
        id: '123',
        room: '1234',
        videoroom: 'talking',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({
            id: '123',
            state: RemoteFeedState.ready,
            muted: true,
            volume: 127,
          }),
        },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds['123'].muted).toEqual(false);
      expect(state.remoteFeeds['123'].volume).toEqual(96.95);
    });

    it('should process a stopped-talking message', () => {
      const msg = {
        'audio-level-dBov-avg': 127,
        id: '123',
        room: '1234',
        videoroom: 'stopped-talking',
      };

      const payload = {
        message: 'message',
        payload: { msg },
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({
            id: '123',
            state: RemoteFeedState.ready,
          }),
        },
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds['123'].muted).toEqual(true);
      expect(state.remoteFeeds['123'].volume).toEqual(127);
    });
  });

  describe('AttachRemoteFeed', () => {
    it('should dispatch an attach remote feed message correctly', () => {
      const feed = RemoteFeedFactory.build({ id: '123' });
      const roomInfo = RoomInfoFactory.build();
      const payload = {feed, roomInfo, pin: 'pin'};

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({id: '123'}),
        },
      };

      const action = new fromActions.AttachRemoteFeed(payload);
      const state = fromJanus.reducer(incomingState, action);

      const expectedRemoteFeeds = {
        123: {
          ...incomingState.remoteFeeds['123'],
          state: RemoteFeedState.attaching,
        },
      };

      expect(state.remoteFeeds).toEqual(expectedRemoteFeeds);
    });

    it('should dispatch an attach remote feed message correctly -- feed does not exist', () => {
      const feed = RemoteFeedFactory.build();

      const roomInfo = RoomInfoFactory.build({
        state: RoomInfoState.initialized,
        id: '111',
        publishState: PublishState.ready,
      });
      const payload = {feed, roomInfo, pin: 'pin'};

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          456: RemoteFeedFactory.build()
        }
      };

      const action = new fromActions.AttachRemoteFeed(payload);
      const state = fromJanus.reducer(incomingState, action);
      expect(state.remoteFeeds).toEqual(incomingState.remoteFeeds);
    });
  });

  describe('OnLocalStream', () => {
    it('should save the local stream', () => {
      const payload = {
        message: 'local stream',
        payload: {
          stream_id: 'abc'
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.roomInfo.localStreamId).toEqual('abc');
      expect(state.roomInfo.publishState).toEqual(PublishState.start);
    });
  });

  describe('OnRemoteStream', () => {
    it('should save the remote stream to the right feed', () => {
      const payload = {
        message: '[remote] remote stream',
        payload: {
          streamId: 'xxx',
          numVideoTracks: 1,
          feed: {
            state: 'initialized',
            streamId: null,
            displayName: 'asdf',
            id: 999,
            audio_codec: 'opus',
            video_codec: 'vp8'
          },
          room: {
            state: RoomInfoState.joined,
            id: '1234',
            description: 'Demo Room',
            privateId: 1269333386,
            otherRoomId: 4016626198144728
          }
        }
      };

      const incomingState = {...initialState};
      const rf = RemoteFeedFactory.build({
        state: RemoteFeedState.attached,
        id: '999',
        numVideoTracks: 0,
      });
      incomingState.remoteFeeds = {999: rf};

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);
      expect(state.remoteFeeds).toEqual({999: {...rf, numVideoTracks: 1, streamId: 'xxx', state: RemoteFeedState.ready}});
    });

    it('should ignore a remote stream if the remoteFeed does not exist', () => {
      const payload = {
        message: '[remote] remote stream',
        payload: {
          streamId: '999',
          feed: {
            state: 'initialized',
            streamId: null,
            displayName: 'asdf',
            id: 999,
            audio_codec: 'opus',
            video_codec: 'vp8'
          },
          room: {
            state: RoomInfoState.joined,
            id: '1234',
            description: 'Demo Room',
            privateId: 1269333386,
            otherRoomId: 4016626198144728
          }
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);
      expect(state.remoteFeeds).toEqual({});
    });
  });

  describe('SlowLink', () => {
    it('should update the slowLink timestamp upon receiving timestamp', () => {
      const payload = {
        message: fromServiceModels.REMOTE_FEED_SLOW_LINK,
        payload: {
          feedId: '123',
        }
      };

      const incomingState = {
        ...initialState,
        remoteFeeds: {
          123: RemoteFeedFactory.build({id: '123'})
        }
      };

      const timestamp = moment.utc();
      jasmine.clock().mockDate(timestamp.toDate());

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(incomingState, action);

      expect(state.remoteFeeds['123'].slowLink).toEqual(timestamp);
    });

    it('should handle slowLink message on non-existent remote feed', () => {
      const payload = {
        message: fromServiceModels.REMOTE_FEED_SLOW_LINK,
        payload: {
          feedId: '123',
        }
      };

      const action = new fromActions.AttachCallback(payload);
      const state = fromJanus.reducer(initialState, action);

      expect(state.remoteFeeds).toEqual({});
    });
  });

  describe('PublishMessages', () => {
    it('should save the publish state on a PublishOwnFeed event', () => {
      const action = new fromActions.PublishOwnFeed({audioDeviceId: 'audio', videoDeviceId: 'video', canvasId: 'canvas-self'});
      const incomingState = {
        ...initialState,
        roomInfo: {
          ...initialState.roomInfo,
          muted: true
        }
      };
      const state = fromJanus.reducer(incomingState, action);
      expect(state.roomInfo.publishState).toEqual(PublishState.publishRequested);
      expect(state.roomInfo.muted).toEqual(false);
    });
  });

  describe('Request Substream', () => {
    it('should the requested substream', () => {
      const feed = RemoteFeedFactory.build();
      const substreamId = 2;
      const action = new fromActions.RequestSubstream({feed, substreamId});

      const myState = {
        ...initialState,
        remoteFeeds: {
          [feed.id]: feed
        }
      };

      const expectedRemoteFeeds = {
        [feed.id]: {
          ...feed,
          requestedSubstream: 2,
        }
      };
      const state = fromJanus.reducer(myState, action);
      expect(state.remoteFeeds).toEqual(expectedRemoteFeeds);
    });
    it('should the requested substream -- feed does not exist', () => {
      const feed = RemoteFeedFactory.build();
      const substreamId = 2;
      const action = new fromActions.RequestSubstream({feed, substreamId});

      const state = fromJanus.reducer(initialState, action);
      expect(state.remoteFeeds).toEqual({});
    });
  });

  describe('Muting', () => {
    it('should update the mute status correctly -- false to false', () => {
      const action = new fromActions.ToggleMuteSuccess(false);
      const state = fromJanus.reducer(initialState, action);
      expect(state.roomInfo.muted).toEqual(false);
    });
    it('should update the mute status correctly -- false to true', () => {
      const action = new fromActions.ToggleMuteSuccess(true);
      const state = fromJanus.reducer(initialState, action);
      expect(state.roomInfo.muted).toEqual(true);
    });
    it('should update the mute status correctly -- true to true', () => {
      const incomingState = {
        ...initialState,
        roomInfo: {
          ...initialState.roomInfo,
          muted: true
        }
      };
      const action = new fromActions.ToggleMuteSuccess(true);
      const state = fromJanus.reducer(incomingState, action);
      expect(state.roomInfo.muted).toEqual(true);
    });
    it('should update the mute status correctly -- true to false', () => {
      const incomingState = {
        ...initialState,
        roomInfo: {
          ...initialState.roomInfo,
          muted: true
        }
      };
      const action = new fromActions.ToggleMuteSuccess(false);
      const state = fromJanus.reducer(incomingState, action);
      expect(state.roomInfo.muted).toEqual(false);
    });
  });
});
