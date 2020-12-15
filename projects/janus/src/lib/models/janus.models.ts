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
 * Room state machine
 */
export enum RoomInfoState {
  start = 'start',
  initializing = 'initializing',
  initialized = 'initialized',
  attaching = 'attaching',
  attached = 'attached',
  attach_failed = 'attach_failed',
  joining = 'joining',

  /** Once joined, you can start publishing */
  joined = 'joined',
  error = 'error',
}

/**
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
 * Metadata for a room
 */
export interface RoomInfo {

  /** State of the room */
  state: RoomInfoState;

  /** roomId */
  id: string;

  /** Description of the room */
  description: string;

  /** private_id assigned by janus */
  privateId: number;

  /** Value passed back in "joined" message */
  otherRoomId: number;  // This comes back in the "joined" message. Not sure what to use it for

  /** Set to error code if there was an error in the room */
  errorCode: number;

  /** Local publishing state */
  publishState: PublishState;

  /** @internal Internal stream id */
  localStreamId: string;

  /** True iff the audio is muted */
  muted: boolean;
}

/**
 * Remote feed state machine
 */
export enum RemoteFeedState {
  initialized = 'initialized',
  attaching = 'attaching',
  attached = 'attached',
  ready = 'ready',
  error = 'error',
}

/**
 * Current state of a remote feed
 * There exists a remote feed object for each available publisher in the video
 * room. It's possible to attach to these
 */
export interface RemoteFeed {
  /** Current state of the feed */
  state: RemoteFeedState;

  /** Id of the publisher */
  id: string;

  /** @internal */
  streamId: string;

  /** number of video tracks available */
  numVideoTracks: number;

  /** Substream requested */
  requestedSubstream: number;

  /** Substream currently being received */
  currentSubstream: number;

  /** Display name of the publisher */
  displayName: string;

  /** @internal */
  audio_codec: string;

  /** @internal */
  video_codec: string;

  /** @internal */
  volume: number;

  /** @internal */
  muted: boolean;

  /** timestamp of most recent slowLink event on this feed */
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
