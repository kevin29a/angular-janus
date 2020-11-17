/*
 * janus.reducers.ts
 *
 * Originally for reducers as part of an ngrx global store. Repurposing some of
 * this to work in a component store when breaking this into a library
 */

import * as moment from 'moment';
import * as janusActions from '../actions/janus.actions';
import {
  PublishState,
  RemoteFeed,
  RemoteFeedState,
  RoomInfo,
  RoomInfoState,
} from '../../models/janus.models';
import * as fromServiceModels from '../../models/janus-server.models';

export interface VideoroomState {
  roomInfo: RoomInfo;
  remoteFeeds: { [id: string]: RemoteFeed };
}

export const initialState: VideoroomState = {
  roomInfo: {
    state: RoomInfoState.start,
    id: null,
    description: null,
    privateId: null,
    otherRoomId: null,

    errorCode: null,

    publishState: PublishState.start,
    localStreamId: null,
    muted: false,
  },
  remoteFeeds: {},
};

function on_message_reducer(
  state: VideoroomState,
  data: fromServiceModels.JanusMessage,
): VideoroomState {
  function parse_publishers(localState: VideoroomState, publishers: fromServiceModels.Pub[]): VideoroomState {
    // add all publishers into the state. I call them remoteFeeds on this side
    const remoteFeeds: { [id: number]: RemoteFeed } = {...localState.remoteFeeds} || {};
    for (const publisher of publishers) {
      if (publisher.id in remoteFeeds) {
        remoteFeeds[publisher.id].displayName = publisher.display;
      } else {
        remoteFeeds[publisher.id] = {
          state: RemoteFeedState.initialized,
          streamId: null,
          displayName: publisher.display,
          id: publisher.id,
          numVideoTracks: 0,
          requestedSubstream: 0,
          currentSubstream: 0,
          audio_codec: publisher.audio_codec,
          video_codec: publisher.video_codec,
          muted: false,
          volume: 64,
          slowLink: null,
        };
      }
    }
    return {
      ...localState,
      remoteFeeds,
    };
  }

  switch (data.videoroom) {
    case 'joined': {
      const newState: VideoroomState = parse_publishers(state, data.publishers);
      return {
        ...newState,
        roomInfo: {
          state: RoomInfoState.joined,
          id: data.room,
          description: data.description,
          privateId: data.private_id,
          otherRoomId: data.id,

          errorCode: null,

          publishState: PublishState.ready,
          localStreamId: null,
          muted: false,
        }
      };
    }

    case 'event': {
      let newState: VideoroomState = {...state};
      if (!!data.publishers) {
        newState = parse_publishers(newState, data.publishers);
      }

      if (!!data.unpublished) {
        const { [data.unpublished]: removed, ...remoteFeeds } = newState.remoteFeeds;
        newState.remoteFeeds = remoteFeeds;
      }

      if (!!data.leaving) {
        const { [data.leaving]: removed, ...remoteFeeds } = newState.remoteFeeds;
        newState.remoteFeeds = remoteFeeds;
      }

      if (data.reason === 'kicked') {
        newState = {
          ...newState,
          roomInfo: {
            ...newState.roomInfo,
            publishState: PublishState.error,
            errorCode: fromServiceModels.CustomErrors.kicked,
          }
        };
      }

      if (data.configured === 'ok') {
        // Update that we're now publishing
        newState = {
          ...newState,
          roomInfo: {
            ...newState.roomInfo,
            publishState: PublishState.publishing
          }
        };
      }

      if ('error_code' in data) {
        // Update that we're now publishing
        newState = {
          ...newState,
          roomInfo: {
            ...newState.roomInfo,
            publishState: PublishState.error,
            errorCode: data.error_code,
          }
        };
      }
      return newState;
    }

    case 'talking':
    case 'stopped-talking': {
      if (!(data.id in state.remoteFeeds)) {
        return state;
      } else {
        return {
          ...state,
          remoteFeeds: {
            ...state.remoteFeeds,
            [data.id]: {
              ...state.remoteFeeds[data.id],
              volume: data['audio-level-dBov-avg'],
              muted: data['audio-level-dBov-avg'] === 127,
            }
          }
        };
      }
    }
  }

  return state;
}

function callback_reducer(
  state: VideoroomState,
  data: fromServiceModels.JanusAttachCallbackData
): VideoroomState {

  switch (data.message) {
    case fromServiceModels.ATTACH_SUCCESS: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          state: RoomInfoState.attached,
        },
      };
    }

    case fromServiceModels.ON_LOCAL_STREAM: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
            localStreamId: data.payload.stream_id,
        },
      };
    }

    case fromServiceModels.ON_MESSAGE: {
      return on_message_reducer(state, data.payload.msg);
    }

    case fromServiceModels.ON_REMOTE_FEED_MESSAGE: {
      const msg = data.payload.msg;
      switch (msg.videoroom) {
        case 'attached': {
          if (msg.id in state.remoteFeeds) {
            return {
              ...state,
              remoteFeeds: {
                ...state.remoteFeeds,
                [msg.id]: {
                  ...state.remoteFeeds[msg.id],
                  state: RemoteFeedState.attached,
                }
              }
            };
          }
          break;
        }

        case 'event': {
          const feedId = data.payload.feed.id;
          if (feedId in state.remoteFeeds) {
            if ('substream' in msg) {
              return {
                ...state,
                remoteFeeds: {
                  ...state.remoteFeeds,
                  [feedId]: {
                    ...state.remoteFeeds[feedId],
                    currentSubstream: msg.substream,
                  }
                }
              };
            }
          }
        }
      }
      return state;
    }

    case fromServiceModels.ON_REMOTE_REMOTE_STREAM: {
      const remoteFeeds = {...state.remoteFeeds};
      if (!!remoteFeeds && data.payload.feed.id in remoteFeeds) {
        remoteFeeds[data.payload.feed.id] = {
          ...remoteFeeds[data.payload.feed.id],
          streamId: data.payload.streamId,
          numVideoTracks: data.payload.numVideoTracks,
          state: RemoteFeedState.ready,
        };
      }
      return {
        ...state,
        remoteFeeds
      };
    }

    case fromServiceModels.REMOTE_FEED_SLOW_LINK: {
      if (data.payload.feedId in state.remoteFeeds) {
        return {
          ...state,
          remoteFeeds: {
            ...state.remoteFeeds,
            [data.payload.feedId]: {
              ...state.remoteFeeds[data.payload.feedId],
              slowLink: moment.utc(),
            }
          }
        };
      }
      break;
    }
  }

  return state;
}

export function reducer(
  state = initialState,
  action: janusActions.JanusAction
): VideoroomState {
  switch (action.type) {
    case janusActions.INITIALIZE_JANUS: {
      return {
        ...initialState,
        roomInfo: {
          ...initialState.roomInfo,
          state: RoomInfoState.initializing,
        },
      };
    }

    case janusActions.INITIALIZE_JANUS_SUCCESS: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          state: RoomInfoState.initialized,
        }
      };
    }

    case janusActions.ATTACH_VIDEO_ROOM: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          state: RoomInfoState.attaching,
        },
      };
    }

    case janusActions.ATTACH_VIDEO_ROOM_FAIL: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          state: RoomInfoState.attach_failed,
        },
      };
    }

    case janusActions.ATTACH_CALLBACK: {
      return callback_reducer(state, action.payload);
    }

    case janusActions.PUBLISH_OWN_FEED: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          publishState: PublishState.publishRequested,
          muted: false,
        }
      };
    }

    case janusActions.ATTACH_REMOTE_FEED: {
      if (action.payload.feed.id in state.remoteFeeds) {
        return {
          ...state,
          remoteFeeds: {
            ...state.remoteFeeds,
            [action.payload.feed.id]: {
              ...state.remoteFeeds[action.payload.feed.id],
              state: RemoteFeedState.attaching,
            }
          }
        };
      } else {
        return state;
      }
    }

    case janusActions.DESTROY_JANUS: {
      return initialState;
    }

    case janusActions.TOGGLE_MUTE_SUCCESS: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          muted: action.payload
        }
      };
    }

    case janusActions.REQUEST_SUBSTREAM: {
      const {feed, substreamId} = action.payload;
      if (feed.id in state.remoteFeeds) {
        return {
          ...state,
          remoteFeeds: {
            ...state.remoteFeeds,
            [feed.id]: {
              ...state.remoteFeeds[feed.id],
              requestedSubstream: substreamId,
            }
          }
        };
      }
      break;
    }

    case janusActions.REGISTER: {
      return {
        ...state,
        roomInfo: {
          ...state.roomInfo,
          state: RoomInfoState.joining,
        },
      };
    }

    case janusActions.TEST_ADD_REMOTE_FEED: {
      const remoteFeed = action.payload as RemoteFeed;
      return {
        ...state,
        remoteFeeds: {
          ...state.remoteFeeds,
          [remoteFeed.id]: remoteFeed
        }
      };
    }
  }
  return state;
}
