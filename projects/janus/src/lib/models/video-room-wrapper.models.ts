import { EventEmitter, } from '@angular/core';

import {
  Devices,
  JanusRole,
  RemoteFeed,
  RoomInfo,
} from './janus.models';


/**
 * Data for the publishOwnFeed event emitted by a videoroom. This event will
 * tell the system to start publishing the local feed of the user. By default,
 * you can specify an audioDeviceId and videoDeviceId and the system will capture
 * video/audio from those devices. Alternatively, if skipVideoCapture is set to
 * true, the stream from the canvas element will be published without audio. The
 * videoroom will take full responsibility for drawing to the canvas element
 */
export interface PublishOwnFeedEvent {

  /** Device ID for the microphone. ID matches what is returned by `navigator.mediaDevics.enumerateDevices` */
  audioDeviceId: string;

  /** Device ID for the camera. ID matches what is returned by `navigator.mediaDevics.enumerateDevices` */
  videoDeviceId: string;

  /** HTML ID of the canvas element. Must exist in all use cases, even not drawing on
   * the canvas manually. If document.getElementById([canvasId]) does not return a canvas
   * element, this will fail
   */
  canvasId: string;

  /** If true, directs the service to not setup a video element. It will instead transmit
   * a video stream from the canvas element
   */
  skipVideoCapture: boolean;
}


/** Data for the requestSubstream event. The event is used to request different
 * substreams when the publisher is using multicast, which is the default.
 */
export interface RequestSubstreamEvent {
  /** Remote feed that we're requesting a different substream for. */
  feed: RemoteFeed;

  /** The integer id of the stream to request. */
  substreamId: number;
}

/** Data for the attachRemoteFeedEvent. The event will negotiate a connection to
 * receive the remote stream. This must be called on each remote feed the user wishes
 * to receive.
 */
export interface AttachRemoteFeedEvent {
  /** Remote feed that we're requesting. The stream must be in the `RemoteFeedState.initialized` state. */
  feed: RemoteFeed;

  /** Room info object for the room the remote feed belongs to. */
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
