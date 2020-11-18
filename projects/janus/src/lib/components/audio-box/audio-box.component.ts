import { AfterViewInit, Component, Input, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';

import { RemoteFeed, Devices } from '../../models/janus.models';
import { JanusService } from '../../services/janus.service';

/** @internal */
@Component({
  selector: 'janus-nvid-audio-box',
  templateUrl: './audio-box.component.html',
  styleUrls: ['./audio-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioBoxComponent implements OnInit, AfterViewInit {

  @Input() remoteFeed: RemoteFeed;
  @Input()
  get devices(): Devices {
    return this.localDevices;
  }
  set devices(devices: Devices) {
    this.onDeviceChange(devices);
    this.localDevices = devices;
  }

  private localDevices: Devices;
  public audioId: string;

  @ViewChild('audioElement') audio: ElementRef;

  constructor(
    private janusService: JanusService,
  ) { }

  ngOnInit(): void {
    // Set my unique id for the audio
    const instance = this;
    this.audioId = 'audio-' + this.remoteFeed.id;
  }

  ngAfterViewInit(): void {
    this.janusService.attachMediaStream(this.audioId, this.remoteFeed.streamId);
  }

  setSpeaker(devices: Devices): void {
    if (
      this.audio
      && this.audio.nativeElement
      && this.audio.nativeElement.setSinkId
      && devices
      && devices.speakerDeviceId
    ) {
      this.audio.nativeElement.setSinkId(devices.speakerDeviceId);
    }
  }

  onDeviceChange(devices: Devices): void {
    this.setSpeaker(devices);
  }
}
