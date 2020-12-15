import * as moment from 'moment';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';

import { Subject, interval, fromEvent } from 'rxjs';
import { first, takeUntil, debounce } from 'rxjs/operators';

import { RemoteFeed, JanusRole, Devices, RequestSubstreamEvent } from '../../models';
import { randomString } from '../../shared';
import { JanusService } from '../../services/janus.service';

import { VideoQualityHelper } from './video-quality-helper';


/**
 * Component for rendering an audio/video stream received from a remote publisher
 *
 * In addition to rendering the video content, this will keep track of the streaming
 * performance and request higher/lower bitrate streams when simulcast is available.
 */
@Component({
  selector: 'janus-video-box',
  templateUrl: './video-box.component.html',
  styleUrls: [
    './video-box.component.scss',
    '../../styles/video-styles.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoBoxComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  /** RemoteFeed object */
  @Input() remoteFeed: RemoteFeed;

  /** Current mode of the videoroom */
  @Input() mode: 'speaker' | 'grid';

  /** Requested output device (speaker). If available, this will dynamically change the
   * speaker device. This is not available in chrome on android
   */
  @Input()
  get devices(): Devices {
    return this.localDevices;
  }
  set devices(devices: Devices) {
    this.localDevices = devices;
    this.onDeviceChange(devices);
  }

  /** Event for switching to speaker/grid view */
  @Output()
  maximize = new EventEmitter<RemoteFeed>();

  /** Event for switching to speaker/grid view */
  @Output()
  requestSubstream = new EventEmitter<RequestSubstreamEvent>();

  /** @internal */
  public videoId: string;

  /** @internal */
  public optionsOpen = false;

  /** @internal */
  public videoAvailable = false;

  /** Helper class for monitoring video quality and determining when to request a new substream */
  videoQualityHelper: VideoQualityHelper; // public for testing purposes

  /** @internal */
  private localDevices: Devices;

  /** @internal */
  private destroy$ = new Subject();

  /** @internal */
  @ViewChild('videoElement') video: ElementRef;

  constructor(
    private janusService: JanusService
  ) {
    this.videoQualityHelper = new VideoQualityHelper(3);
  }

  ngOnInit(): void {
    // Set my unique id for the video
    this.videoId = 'video-' + this.remoteFeed.id + this.mode;
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this._attachMediaStream();
    this.setSpeaker(this.devices);
  }

  ngOnChanges(changes): void {
    if ('remoteFeed' in changes) {
      // If there's a change in the remoteFeed, run the video quality monitor task
      let slowLink = false;

      if (
        changes.remoteFeed.previousValue
        && changes.remoteFeed.previousValue.slowLink !== changes.remoteFeed.currentValue.slowLink
      ) {
        slowLink = true;
      }

      this.monitorVideoQuality(slowLink);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.video) {
      this.video.nativeElement.pause();
    }
  }

  /** Interval for checking video quality */
  setupSubscriptions(): void {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.monitorVideoQuality(false);
    });
  }

  /** @internal */
  _attachMediaStream(): void {
    this.janusService.attachMediaStream(this.videoId, this.remoteFeed.streamId);
  }

  /** @internal */
  private setSpeaker(devices: Devices): void {
    // Given the devices, set the output sound device
    if (
      this.video
      && this.video.nativeElement
      && this.video.nativeElement.setSinkId
      && devices
      && devices.speakerDeviceId
    ) {
      this.video.nativeElement.setSinkId(devices.speakerDeviceId);
    }
  }

  /** @internal */
  onPlay(): void {
    this.videoAvailable = true;
  }

  /** Called anytime the `remoteFeed` changes plus on a set interval */
  monitorVideoQuality(slowLink: boolean): void {
    // Periodic task to monitor the video quality and change substream if necessary

    if (!this.remoteFeed) {
      // If we don't have a remoteFeed, nothing we can do here
      return;
    }

    if (!this.videoAvailable && this.video) {
      // Sometimes this needs a kick start. For example, if the user takes a second to click
      // the "allow" button for video/mic access, the autoplay on the video element won't
      // actually autoplay
      this.video.nativeElement.play();
    }

    const currentSubstream = this.remoteFeed.currentSubstream;
    if (this.remoteFeed.numVideoTracks === 0 || slowLink) {
      this.videoQualityHelper.streamError(currentSubstream);
      if (currentSubstream > 0) {
        this.switchSubstream(currentSubstream - 1);
      }
    } else {
      const newSubstream = this.videoQualityHelper.ping(currentSubstream);
      if (newSubstream > currentSubstream) {
        this.videoQualityHelper.streamEnd(currentSubstream);
        this.switchSubstream(newSubstream);
      }
    }
  }

  /** Called to request a new substream */
  switchSubstream(substreamId: number): void {
    // Switch the substream if we haven't already requested this substream
    if (this.remoteFeed.requestedSubstream !== substreamId) {
      console.log('switching substream', substreamId, this.videoId);
      this.requestSubstream.emit({feed: this.remoteFeed, substreamId});
    }
  }

  /** Callback for the maximize button */
  onMaximize(): void {
    this.maximize.emit(this.remoteFeed);
  }

  /** Attempts to change speaker if requested */
  onDeviceChange(devices: Devices): void {
    this.setSpeaker(devices);
  }
}
