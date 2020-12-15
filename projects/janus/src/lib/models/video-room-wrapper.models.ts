import { EventEmitter, } from '@angular/core';

import {
  Devices,
  JanusRole,
  RemoteFeed,
  RoomInfo,
} from './janus.models';


export interface PublishOwnFeedEvent {
  audioDeviceId: string;
  videoDeviceId: string;
  canvasId: string;
  skipVideoCapture: boolean;
}

export interface RequestSubstreamEvent {
  feed: RemoteFeed;
  substreamId: number;
}

export interface AttachRemoteFeedEvent {
  feed: RemoteFeed;
  roomInfo: RoomInfo;
}

/**
 * Interface for customer video room component
 *
 * Any provided custom video room must implement this interface. You need not use all of the
 * data if your use case doesn't require it. For example, a room might be publish only, in which
 * case the remoteFeeds can be ignored
 */
export interface VideoRoomComponent {

  /** roomInfo object */
  roomInfo: RoomInfo;

  /** Role of the user */
  role: JanusRole;

  /** Which devices to user */
  devices?: Devices;

  /** List of available feeds */
  remoteFeeds: RemoteFeed[];

  /** Event to request a different substream */
  requestSubstream: EventEmitter<RequestSubstreamEvent>;

  /** Event to publish a locally collected feed */
  publishOwnFeed: EventEmitter<PublishOwnFeedEvent>;

  /** Event to subscribe to another publisher's feed */
  attachRemoteFeed: EventEmitter<AttachRemoteFeedEvent>;
}
