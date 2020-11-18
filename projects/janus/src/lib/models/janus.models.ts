import * as moment from 'moment';

/**
 * Device specifications
 */
export interface Devices {

  /** Microphone Device ID */
  audioDeviceId: string;

  /** Camera Device ID */
  videoDeviceId: string;

  /** Speaker Device ID */
  speakerDeviceId: string;
}

/**
 * @internal
 * State for a room
 */
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

/**
 * @internal
 * Current publish status
 */
export enum PublishState {
  start = 'start',
  ready = 'ready',
  publishRequested = 'publish requested',
  publishing = 'publishing',
  error = 'error',
}

/**
 * @internal
 * State information for a room
 */
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

/**
 * @internal
 * Possible states for a remote feed
 */
export enum RemoteFeedState {
  initialized = 'initialized',
  attaching = 'attaching',
  attached = 'attached',
  ready = 'ready',
  error = 'error',
}

/**
 * @internal
 * Current state of a remote feed
 */
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

/**
 * Information for a publisher. Note that the volume/mute information is not
 * very practical in how it's implemented in janus currently. In order to get
 * meaningful information about talking/not talking, you'll need to know the
 * average background noise level of each publisher ahead of time. This is
 * specified at `audio_level_average` in the room. This isn't practical if you
 * don't know the publisher's system setup ahead of time. We set the
 * `audio_level_average` to 127 in the backend configuration. That makes the
 * start/stop talking events good for knowing if the remote user has muted.
 * You might want to ignore this information depending on your use case.
 */
export interface Publisher {

  /** Janus ID of the publisher */
  id: string;

  /** Display name of the publisher */
  displayName: string;

  /**
   * Current volume of the publisher's audio. See notes in the interface description.
   */
  volume: number;

  /** Set to true iff the last volume event had the volume at 127 */
  muted: boolean;
}

/**
 * Possible roles for a user.
 */
export enum JanusRole {
  /** A user in this role will publish their audio/video and see/hear all other publishers */
  publisher = 'publisher',

  /** A user in this role will *not* publish their audio/video. They will still see/hear all other publishers */
  listener = 'listener',
}

/**
 * IceServer configuration. More details are in the {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer|MDN Docs}
 */
export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}
