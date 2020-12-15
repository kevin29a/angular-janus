import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {
  Devices,
  PublishOwnFeedEvent,
  PublishState,
  RoomInfo,
  RoomInfoState,
} from '../../models';

/**
 * Component for rendering video captured from a local device. Component both renders
 * the video and emits events to publish it to the janus server
 */
@Component({
  selector: 'janus-self-video',
  templateUrl: './self-video.component.html',
  styleUrls: [
    './self-video.component.scss',
    '../../styles/video-styles.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelfVideoComponent implements OnInit, AfterViewInit {

  /** roomInfo object. Component will raise a fatal error if the state
   * is not `RoomInfoState.joined`
   */
  @Input() roomInfo: RoomInfo;

  /** Devices to capture */
  @Input()
  get devices(): Devices { return this.currentDevices; }
  set devices(devices) {
    this.onDevicesChange(this.currentDevices, devices);
    this.currentDevices = devices;
  }

  /** Event to publish the local stream */
  @Output()
  publishOwnFeed = new EventEmitter<PublishOwnFeedEvent>();

  private currentDevices: Devices;
  private devicesInitialized = false;
  private afterViewInitRan = false;

  constructor() { }

  ngOnInit(): void { }

  async ngAfterViewInit(): Promise<void> {
    // Attach the canvas-self element
    this.afterViewInitRan = true;
    if (this.roomInfo.state !== RoomInfoState.joined) {
      throw new Error('RoomInfo.state must be "joined" before creating a self-video component');
    }

    const audioDeviceId = this.devices ? this.devices.audioDeviceId : null;
    const videoDeviceId = this.devices ? this.devices.videoDeviceId : null;
    this._publishOwnFeed(audioDeviceId, videoDeviceId);
  }

  /** @internal */
  _publishOwnFeed(audioDeviceId: string, videoDeviceId: string): void {
    // Separate this for testing
    this.publishOwnFeed.emit({
      audioDeviceId,
      videoDeviceId,
      canvasId: 'canvas-self',
      skipVideoCapture: false,
    });
  }

  /** @internal */
  onDevicesChange(previousDevices: Devices, newDevices: Devices): void {
    if (!newDevices) {
      return;
    }

    /* Minor dragon:
     * publishOwnFeed won't work unless we know the devices **and** the canvas element already exists.
     * Therefore, the first call to publishOwnFeed comes in ngAfterViewInit. After the first publish, we
     * can adjust the devices in onDevicesChange.
     */
    if (!this.afterViewInitRan) {
      // Haven't loaded yet
      return;
    }

    if (
      newDevices
      && previousDevices
      && newDevices.videoDeviceId === previousDevices.videoDeviceId
      && newDevices.audioDeviceId === previousDevices.audioDeviceId
    ) {
      // Same capture devices. nothing to do here
      return;
    }

    // There still exists a tiny race condition here. If the user changes the deviceId between a publishOwnFeed
    // call in ngAfterViewInit and before the publish is complete, that change won't be registered :/
    if (this.roomInfo.publishState === PublishState.publishRequested) {
      return;
    }
    this._publishOwnFeed(newDevices.audioDeviceId, newDevices.videoDeviceId);
  }
}
