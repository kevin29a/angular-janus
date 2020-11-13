import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';

import { Store } from '@ngrx/store';

import { WebrtcService } from '../../services/janus.service';
import {
  RoomInfo,
  RoomInfoState,
  PublishState,
  Devices,
} from '../../models/janus.models';

import { JanusState, PublishOwnFeed } from '../../store';

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

  @Input() roomInfo: RoomInfo;

  @Input()
  get devices(): Devices { return this.currentDevices; }
  set devices(devices) {
    this.onDevicesChange(this.currentDevices, devices);
    this.currentDevices = devices;
  }

  private currentDevices: Devices;
  private afterViewInitRan = false;

  constructor(
    private store: Store<JanusState>,
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    // Attach the canvas-self element
    this.afterViewInitRan = true;
    if (this.roomInfo.state !== RoomInfoState.joined) {
      throw new Error('RoomInfo.state must be "joined" before creating a self-video component');
    }
    if (this.devices) {
      this.publishOwnFeed(this.devices.audioDeviceId, this.devices.videoDeviceId);
    }
  }

  publishOwnFeed(audioDeviceId: string, videoDeviceId: string): void {
    // Separate this for testing
    this.store.dispatch(new PublishOwnFeed({
      audioDeviceId,
      videoDeviceId,
      canvasId: 'canvas-self',
    }));
  }

  onDevicesChange(previousDevices: Devices, newDevices: Devices): void {
    if (!newDevices) {
      return;
    }

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
      // Same devices. nothing to do here
      return;
    }

    this.publishOwnFeed(newDevices.audioDeviceId, newDevices.videoDeviceId);
  }
}
