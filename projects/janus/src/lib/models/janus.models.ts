import * as moment from 'moment';

export interface Devices {
  audioDeviceId: string;
  videoDeviceId: string;
  speakerDeviceId: string;
}

export interface JanusStuff {
  message: string;
}

export interface Feed {
  id: number;
  isOwn: boolean;
}

export enum RoomInfoState {
  start = 'start',
  initializing = 'initializing',
  initialized = 'initialized',
  attaching = 'attaching',
  attached = 'attached',
  attach_failed = 'attach_failed',
  joining = 'joining',
  joined = 'joined',
  error = 'error',
}

export enum PublishState {
  start = 'start',
  ready = 'ready',
  publishRequested = 'publish requested',
  publishing = 'publishing',
  error = 'error',
}

export interface RoomInfo {
  state: RoomInfoState;
  id: string;
  description: string;
  privateId: number;
  otherRoomId: number;  // This comes back in the "joined" message. Not sure what to use it for

  errorCode: number;

  // Local publishing state
  publishState: PublishState;
  localStreamId: string;
  muted: boolean;
}

export enum RemoteFeedState {
  initialized = 'initialized',
  attaching = 'attaching',
  attached = 'attached',
  ready = 'ready',
  error = 'error',
}

export interface RemoteFeed {
  state: RemoteFeedState;
  id: string;
  streamId: string;
  numVideoTracks: number;
  requestedSubstream: number;
  currentSubstream: number;
  displayName: string;
  audio_codec: string;
  video_codec: string;
  volume: number;
  muted: boolean;
  slowLink: moment.Moment;
}

export interface Publisher {
  id: string;
  displayName: string;
  volume: number;
  muted: boolean;
}

export enum JanusRole {
  admin = 'admin',
  publisher = 'publisher',
  listener = 'listener',
}

export interface JanusEnvironment {
  iceServers: {urls: string}[];
  janusServer: {
    httpUrl: string,
    wsUrl: string,
  };
}
