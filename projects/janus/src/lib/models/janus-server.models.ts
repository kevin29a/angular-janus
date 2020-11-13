export const ATTACH_SUCCESS = 'attach success';
export const CONSENT_DIALOG = 'consent dialog';
export const MEDIA_STATE = 'media state';
export const WEBRTC_STATE = 'webrtc state';
export const SLOW_LINK = 'slow link';
export const ON_MESSAGE = 'message';
export const ON_LOCAL_STREAM = 'local stream';
export const ON_REMOTE_STREAM = 'remote stream';
export const ON_DATA_OPEN = 'data open';
export const ON_DATA = 'data';
export const ON_CLEANUP = 'cleanup';
export const DETACHED = 'detached';

// Many of these messages are repeated when attaching to a remote feed.
// Explicitly separating the different callbacks here
export const ON_REMOTE_FEED_MESSAGE = '[remote] message';
export const REMOTE_FEED_WEBRTC_STATE = '[remote] webrtc state';
export const REMOTE_FEED_SLOW_LINK = '[remote] slow link';
export const ON_REMOTE_LOCAL_STREAM = '[remote] local stream';
export const ON_REMOTE_REMOTE_STREAM = '[remote] remote stream';
export const ON_REMOTE_CLEANUP = '[remote] cleanup';

export interface JanusAttachCallbackData {
  message: string;
  payload?: any;
}

export interface Pub {
  id: string;
  display: string;
  audio_codec: string;
  video_codec: string;
  talking?: boolean;
}

export interface JanusMessage {
  videoroom: string;
  room: string;
  description?: string;
  id?: number;
  private_id?: number;
  publishers?: Pub[];
  unpublished?: string;
  configured?: string;
  error_code?: number;
  error?: string;
  leaving?: string;
  reason?: string;
}

export interface Participant {
  id: string;
  display: string;
  publisher: boolean;
  talking: boolean;
}

export enum CustomErrors {
  kicked = 9991,
  server_down = 9992,
}

export const JanusErrors = {
  499: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_UNKNOWN_ERROR',
    message: 'Internal Error',
  },
  421: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_NO_MESSAGE',
    message: 'Internal Error',
  },
  422: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_INVALID_JSON',
    message: 'Internal Error',
  },
  423: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_INVALID_REQUEST',
    message: 'Internal Error',
  },
  424: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_JOIN_FIRST',
    message: 'Internal Error',
  },
  425: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_ALREADY_JOINED',
    messag: 'You have already joined this room',
  },
  426: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_NO_SUCH_ROOM',
    message: 'This room does not exist',
  },
  427: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_ROOM_EXISTS',
    message: 'Internal Error',
  },
  428: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_NO_SUCH_FEED',
    message: 'Publisher does not exist',
  },
  429: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_MISSING_ELEMENT',
    messag: 'Internal Error',
  },
  430: {
    // This is what's thrown if you don't have the PIN for a room
    janusCode: 'JANUS_VIDEOROOM_ERROR_INVALID_ELEMENT',
    message: 'You do not have permission to enter this room',
  },
  431: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_INVALID_SDP_TYPE',
    message: 'InternalError',
  },
  432: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_PUBLISHERS_FULL',
    message: 'Room is full',
  },
  433: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_UNAUTHORIZED',
    message: 'Permission Denied',
  },
  434: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_ALREADY_PUBLISHED',
    message: 'You are already publishing',
  },
  435: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_NOT_PUBLISHED',
    message: 'Internal Error',
  },
  436: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_ID_EXISTS',
    message: 'User is already in the room on a different device or different tab',
  },
  437: {
    janusCode: 'JANUS_VIDEOROOM_ERROR_INVALID_SDP',
    message: 'Internal Error',
  },

  // Custom codes that don't come from the videoroom plugin
  [CustomErrors.kicked]: {
    janusCode: 'CUSTOM_KICKED',
    message: 'You have been kicked out of the room by the moderator',
  },

  [CustomErrors.server_down]: {
    janusCode: 'CUSTOM_SERVER_DOWN',
    message: 'Unable to connect to the media server',
  },
};
