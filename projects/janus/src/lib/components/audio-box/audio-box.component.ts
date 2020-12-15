import { AfterViewInit, Component, Input, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';

import { RemoteFeed, Devices } from '../../models/janus.models';
import { JanusService } from '../../services/janus.service';

/**
 * Component for playing audio from a stream.
 *
 * This will play the audio from a remoteFeed without rendering the video at all.
 */
@Component({
  selector: 'janus-nvid-audio-box',
  templateUrl: './audio-box.component.html',
  styleUrls: ['./audio-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioBoxComponent implements OnInit, AfterViewInit {

  /** `RemoteFeed` object */
  @Input() remoteFeed: RemoteFeed;

  /** Requested output device (speaker). If available, this will dynamically change the
   * speaker device. This is not available in chrome on android
   */
  @Input()
  get devices(): Devices {
    return this.localDevices;
  }
  set devices(devices: Devices) {
    this.onDeviceChange(devices);
    this.localDevices = devices;
  }

  /** @internal */
  private localDevices: Devices;

  /** @internal */
  public audioId: string;

  /** @internal */
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

  /** @internal */
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

  /** Attempts to change speaker if requested */
  onDeviceChange(devices: Devices): void {
    this.setSpeaker(devices);
  }
}
