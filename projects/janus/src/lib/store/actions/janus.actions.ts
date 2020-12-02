/*
 * janus.actions.ts
 *
 * Originally for actions as part of an ngrx global store. Repurposing some of
 * this to work in a component store when breaking this into a library
 */


import { JanusAttachCallbackData } from '../../models/janus-server.models';
import { RemoteFeed, RoomInfo, IceServer } from '../../models/janus.models';

/** @internal */
interface Action {
  type: string;
  payload?: any;
}

/** @internal */
export interface PublishOwnFeedPayload {
  audioDeviceId: string;
  videoDeviceId: string;
  canvasId: string;
  skipVideoCapture: boolean;
}

/** @internal */
export interface AttachRemoteFeedPayload {
  feed: RemoteFeed;
  roomInfo: RoomInfo;
  pin: string;
}

/** @internal */
export interface RegisterPayload {
  name: string;
  userId: string;
  roomId: string | number;
  pin: string;
}

/** @internal */
export interface RequestSubstreamPayload {
  feed: RemoteFeed;
  substreamId: number;
}

// Initialize Janus
/** @internal */
export const INITIALIZE_JANUS = '[Janus] Initialize Janus';
/** @internal */
export const INITIALIZE_JANUS_SUCCESS = '[Janus] Initialize Janus Success';
/** @internal */
export const INITIALIZE_JANUS_FAIL = '[Janus] Initialize Janus Fail';

/** @internal */
export class InitializeJanus implements Action {
  readonly type = INITIALIZE_JANUS;
  constructor(public payload: IceServer[]) {}
}

/** @internal */
export class InitializeJanusSuccess implements Action {
  readonly type = INITIALIZE_JANUS_SUCCESS;
}

/** @internal */
export class InitializeJanusFail implements Action {
  readonly type = INITIALIZE_JANUS_FAIL;
}

// Attach to videoroom plugin
/** @internal */
export const ATTACH_VIDEO_ROOM = '[Janus] Attach VideoRoom';
/** @internal */
export const ATTACH_VIDEO_ROOM_FAIL = '[Janus] Attach VideoRoom Fail';
/** @internal */
export const ATTACH_CALLBACK = '[Janus] Attach Callback';
/** @internal */
export const REGISTER = '[Janus] Janus register';
/** @internal */
export const ATTACH_MEDIA_STREAM = '[Janus] Attach Media Stream';

/** @internal */
export class AttachVideoRoom implements Action {
  readonly type = ATTACH_VIDEO_ROOM;
  constructor(public payload: string) {}  // Janus URL
}

/** @internal */
export class AttachVideoRoomFail implements Action {
  readonly type = ATTACH_VIDEO_ROOM_FAIL;
  constructor(public payload: any) {}
}

/** @internal */
export class AttachCallback implements Action {
  readonly type = ATTACH_CALLBACK;
  constructor(public payload: JanusAttachCallbackData) {}
}

/** @internal */
export class Register implements Action {
  readonly type = REGISTER;
  constructor(public payload: RegisterPayload) {}
}

/** @internal */
export class AttachMediaStream implements Action {
  readonly type = ATTACH_MEDIA_STREAM;
  constructor(public payload: {elemId: string, streamId: string}) {}
}

// feeds
/** @internal */
export const ATTACH_REMOTE_FEED = '[Janus] Attach Remote Feed';
/** @internal */
export const ATTACH_REMOTE_FEED_FAIL = '[Janus] Attach Remote Feed Fail';
/** @internal */
export const PUBLISH_OWN_FEED = '[Janus] Publish Own Feed';
/** @internal */
export const PUBLISH_OWN_FEED_SUCCESS = '[Janus] Publish Own Feed Success';
/** @internal */
export const PUBLISH_OWN_FEED_FAIL = '[Janus] Publish Own Feed Fail';

/** @internal */
export class AttachRemoteFeed implements Action {
  readonly type = ATTACH_REMOTE_FEED;
  constructor(public payload: AttachRemoteFeedPayload) {}
}

/** @internal */
export class AttachRemoteFeedFail implements Action {
  readonly type = ATTACH_REMOTE_FEED_FAIL;
  constructor(public payload: {feed: RemoteFeed, error: any}) {}
}

/** @internal */
export class PublishOwnFeed implements Action {
  readonly type = PUBLISH_OWN_FEED;
  constructor(public payload: PublishOwnFeedPayload) {}
}

/** @internal */
export class PublishOwnFeedSuccess implements Action {
  readonly type = PUBLISH_OWN_FEED_SUCCESS;
}

/** @internal */
export class PublishOwnFeedFail implements Action {
  readonly type = PUBLISH_OWN_FEED_FAIL;
  constructor(public payload: any) {}
}

// Substream Selection
export const REQUEST_SUBSTREAM = '[Janus] Request Substream';

/** @internal */
export class RequestSubstream implements Action {
  readonly type = REQUEST_SUBSTREAM;
  constructor(public payload: RequestSubstreamPayload) {}
}

// Mute
export const TOGGLE_MUTE_SUCCESS = '[Janus] Toggle Mute Success';

/** @internal */
export class ToggleMuteSuccess implements Action {
  readonly type = TOGGLE_MUTE_SUCCESS;
  constructor(public payload: boolean) {}
}

// Jsep interactions. Most of these are automatic from the service, but
// some errors can occur. It's possible we can inform the user about these
/** @internal */
export const ANSWER_REMOTE_FEED_JSEP_SUCCESS = '[Janus] Answer remote feed jsep success';
/** @internal */
export const ANSWER_REMOTE_FEED_JSEP_FAIL = '[Janus] Answer remote feed jsep fail';

/** @internal */
export class AnswerRemoteFeedJsepSuccess implements Action {
  readonly type = ANSWER_REMOTE_FEED_JSEP_SUCCESS;
}

/** @internal */
export class AnswerRemoteFeedJsepFail implements Action {
  readonly type = ANSWER_REMOTE_FEED_JSEP_FAIL;
  constructor(public payload: any) {}
}

/** @internal */
export type JanusAction =
  | AttachRemoteFeed
  | AttachRemoteFeedFail
  | AnswerRemoteFeedJsepFail
  | AnswerRemoteFeedJsepSuccess
  | PublishOwnFeed
  | PublishOwnFeedSuccess
  | PublishOwnFeedFail
  | RequestSubstream
  | ToggleMuteSuccess
  | AttachVideoRoom
  | AttachVideoRoomFail
  | AttachCallback
  | InitializeJanus
  | InitializeJanusSuccess
  | InitializeJanusFail
  | Register;
