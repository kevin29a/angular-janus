import { RemoteFeed, RoomInfo } from './janus.models';

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
export interface PublishOwnFeedPayload {
  audioDeviceId: string;
  videoDeviceId: string;
  canvasId: string;
  skipVideoCapture: boolean;
}

/** @internal */
export interface RequestSubstreamPayload {
  feed: RemoteFeed;
  substreamId: number;
}
