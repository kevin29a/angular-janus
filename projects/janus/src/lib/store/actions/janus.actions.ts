import { Action } from '@ngrx/store';

import { JanusAttachCallbackData } from '../../models/janus-server.models';
import { RemoteFeed, RoomInfo, JanusEnvironment } from '../../models/janus.models';

// Initialize Janus
export const INITIALIZE_JANUS = '[Janus] Initialize Janus';
export const INITIALIZE_JANUS_SUCCESS = '[Janus] Initialize Janus Success';
export const INITIALIZE_JANUS_FAIL = '[Janus] Initialize Janus Fail';
export const DESTROY_JANUS = '[Janus] Destroy Janus';

export class InitializeJanus implements Action {
  readonly type = INITIALIZE_JANUS;
  constructor(public payload: JanusEnvironment) {}
}

export class InitializeJanusSuccess implements Action {
  readonly type = INITIALIZE_JANUS_SUCCESS;
}

export class InitializeJanusFail implements Action {
  readonly type = INITIALIZE_JANUS_FAIL;
}

export class DestroyJanus implements Action {
  readonly type = DESTROY_JANUS;
}

// Attach to videoroom plugin
export const ATTACH_VIDEO_ROOM = '[Janus] Attach VideoRoom';
export const ATTACH_VIDEO_ROOM_FAIL = '[Janus] Attach VideoRoom Fail';
export const ATTACH_CALLBACK = '[Janus] Attach Callback';
export const REGISTER = '[Janus] Janus register';
export const ATTACH_MEDIA_STREAM = '[Janus] Attach Media Stream';

export class AttachVideoRoom implements Action {
  readonly type = ATTACH_VIDEO_ROOM;
  constructor(public payload: string) {}  // Janus URL
}

export class AttachVideoRoomFail implements Action {
  readonly type = ATTACH_VIDEO_ROOM_FAIL;
  constructor(public payload: any) {}
}

export class AttachCallback implements Action {
  readonly type = ATTACH_CALLBACK;
  constructor(public payload: JanusAttachCallbackData) {}
}

export class Register implements Action {
  readonly type = REGISTER;
  constructor(public payload: {name: string, userId: string, roomId: string, pin: string}) {}
}

export class AttachMediaStream implements Action {
  readonly type = ATTACH_MEDIA_STREAM;
  constructor(public payload: {elemId: string, streamId: string}) {}
}

// feeds
export const ATTACH_REMOTE_FEED = '[Janus] Attach Remote Feed';
export const ATTACH_REMOTE_FEED_FAIL = '[Janus] Attach Remote Feed Fail';
export const PUBLISH_OWN_FEED = '[Janus] Publish Own Feed';
export const PUBLISH_OWN_FEED_SUCCESS = '[Janus] Publish Own Feed Success';
export const PUBLISH_OWN_FEED_FAIL = '[Janus] Publish Own Feed Fail';

export interface PublishOwnFeedPayload {
  audioDeviceId: string;
  videoDeviceId: string;
  canvasId: string;
}

export interface AttachRemoteFeedPayload {
  feed: RemoteFeed;
  roomInfo: RoomInfo;
  pin: string;
}

export class AttachRemoteFeed implements Action {
  readonly type = ATTACH_REMOTE_FEED;
  constructor(public payload: AttachRemoteFeedPayload) {}
}

export class AttachRemoteFeedFail implements Action {
  readonly type = ATTACH_REMOTE_FEED_FAIL;
  constructor(public payload: {feed: RemoteFeed, error: any}) {}
}

export class PublishOwnFeed implements Action {
  readonly type = PUBLISH_OWN_FEED;
  constructor(public payload: PublishOwnFeedPayload) {}
}

export class PublishOwnFeedSuccess implements Action {
  readonly type = PUBLISH_OWN_FEED_SUCCESS;
}

export class PublishOwnFeedFail implements Action {
  readonly type = PUBLISH_OWN_FEED_FAIL;
  constructor(public payload: any) {}
}

// Substream Selection
export const REQUEST_SUBSTREAM = '[Janus] Request Substream';

export class RequestSubstream implements Action {
  readonly type = REQUEST_SUBSTREAM;
  constructor(public payload: { feed: RemoteFeed, substreamId: number}) {}
}

// Mute
export const TOGGLE_MUTE = '[Janus] Toggle Mute';
export const TOGGLE_MUTE_SUCCESS = '[Janus] Toggle Mute Success';

export class ToggleMute implements Action {
  readonly type = TOGGLE_MUTE;
}

export class ToggleMuteSuccess implements Action {
  readonly type = TOGGLE_MUTE_SUCCESS;
  constructor(public payload: boolean) {}
}

// Jsep interactions. Most of these are automatic from the service, but
// some errors can occur. It's possible we can inform the user about these
export const ANSWER_REMOTE_FEED_JSEP_SUCCESS = '[Janus] Answer remote feed jsep success';
export const ANSWER_REMOTE_FEED_JSEP_FAIL = '[Janus] Answer remote feed jsep fail';

export class AnswerRemoteFeedJsepSuccess implements Action {
  readonly type = ANSWER_REMOTE_FEED_JSEP_SUCCESS;
}

export class AnswerRemoteFeedJsepFail implements Action {
  readonly type = ANSWER_REMOTE_FEED_JSEP_FAIL;
  constructor(public payload: any) {}
}


// Actions for testing
export const TEST_ADD_REMOTE_FEED = '[Janus Test] Add remote feed';
export class TestAddRemoteFeed implements Action {
  readonly type = TEST_ADD_REMOTE_FEED;
  constructor(public payload: RemoteFeed) {}
}

export type JanusAction =
  | DestroyJanus
  | AttachRemoteFeed
  | AttachRemoteFeedFail
  | AnswerRemoteFeedJsepFail
  | AnswerRemoteFeedJsepSuccess
  | PublishOwnFeed
  | PublishOwnFeedSuccess
  | PublishOwnFeedFail
  | RequestSubstream
  | ToggleMute
  | ToggleMuteSuccess
  | AttachVideoRoom
  | AttachVideoRoomFail
  | AttachCallback
  | InitializeJanus
  | InitializeJanusSuccess
  | InitializeJanusFail
  | Register
  | TestAddRemoteFeed;
