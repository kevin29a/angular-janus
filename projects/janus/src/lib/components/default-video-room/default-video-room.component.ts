import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';

import { fromEvent, Observable, Subscription, interval, Subject } from 'rxjs';
import { debounce, takeUntil } from 'rxjs/operators';

import {
  AttachRemoteFeedEvent,
  Devices,
  JanusRole,
  PublishOwnFeedEvent,
  RemoteFeed,
  RemoteFeedState,
  RequestSubstreamEvent,
  RoomInfo,
  RoomInfoState,
} from '../../models';

/**
 * Reference implementation of a video room display component.
 *
 * This component displays the visual elements of a videoroom. The webRTC signalling is
 * mostly abstracted away in higher level components. There are a small number of events
 * this component can emit in order to affect the webRTC signalling.
 */
@Component({
  selector: 'janus-default-video-room',
  templateUrl: './default-video-room.component.html',
  styleUrls: ['./default-video-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultVideoRoomComponent implements OnInit, OnDestroy, AfterViewInit {

  /** `RoomInfo` object */
  @Input() roomInfo: RoomInfo;

  /** User's role in this videoroom */
  @Input() role: JanusRole;

  /** Requested devices */
  @Input() devices?: Devices;

  /** Existing `RemoteFeeds`. This component must request any desired `RemoteFeed` be streamed by
   * emitting a attachRemoteStream event. This is not done automatically because it might not be
   * desired to receive all remote feeds, depending on the product. A `RemoteFeed` can be attached
   * to iff its current state is `RemoteFeedState.initialized`. A `RemoteFeed` that is in the
   * `RemoteFeedState.ready` state can be streamed materialized by calling
   * `JanusService.attachMediaStream`.
   */
  @Input()
  get remoteFeeds(): RemoteFeed[] { return this.privateRemoteFeeds; }
  set remoteFeeds(remoteFeeds: RemoteFeed[]) {
    this.onRemoteFeedsChange(this.privateRemoteFeeds, remoteFeeds);
    this.privateRemoteFeeds = remoteFeeds;
  }

  /** List of `RemoteFeeds` objects that are in the `RemoteFeedState.ready` state. */
  readyRemoteFeeds: RemoteFeed[] = [];

  /** Event to request a different substream */
  @Output()
  requestSubstream = new EventEmitter<RequestSubstreamEvent>();

  /** Event to publish a local stream */
  @Output()
  publishOwnFeed = new EventEmitter<PublishOwnFeedEvent>();

  /** Event to begin streaming a remote feed */
  @Output()
  attachRemoteFeed = new EventEmitter<AttachRemoteFeedEvent>();

  /** @internal */
  @ViewChild('viewport') viewport: ElementRef;

  /** @internal */
  private resizeObservable$: Observable<Event>;

  /** @internal */
  private destroy$ = new Subject();

  /** @internal */
  private privateRemoteFeeds: RemoteFeed[] = [];

  /** @internal */
  public videoWidth = 0;
  /** @internal */
  public videoHeight = 0;
  /** @internal */
  public speakerWidth = 0;
  /** @internal */
  public speakerHeight = 0;

  /** @internal */
  public selfVideoRight = 0;
  /** @internal */
  public selfVideoBottom = 0;

  /** Current mode of the video room */
  public mode: 'grid' | 'speaker' = 'grid';

  /** Current speaker in the event we're in speaker mode */
  public speaker: RemoteFeed;

  constructor(
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // subscribe to resize events
    this.resizeObservable$ = fromEvent(window, 'resize');
  }

  ngAfterViewInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get publishing(): boolean {
    return this.role === 'publisher';
  }

  /** Event callback to switch to/from speaker mode */
  onMaximize(remoteFeed: RemoteFeed): void {
    if (this.mode === 'grid') {
      this.speaker = remoteFeed;
      this.mode = 'speaker';
    } else {
      this.mode = 'grid';
    }
  }

  /** Event callback to request a new substream */
  onRequestSubstream(event: RequestSubstreamEvent): void {
    this.requestSubstream.emit(event);
  }

  /** Event callback to publish a local stream */
  onPublishOwnFeed(event: PublishOwnFeedEvent): void {
    this.publishOwnFeed.emit(event);
  }

  /** Called on all changes of `remoteFeeds` */
  onRemoteFeedsChange(previousRemoteFeeds: RemoteFeed[], currentRemoteFeeds: RemoteFeed[]): void {

    this.computeVideoWidth(currentRemoteFeeds.length);
    for (const feed of currentRemoteFeeds) {
      if (feed.state === RemoteFeedState.initialized) {
        this.attachRemoteFeed.emit({
          roomInfo: this.roomInfo,
          feed,
        });
      }
    }

    this.readyRemoteFeeds = currentRemoteFeeds.filter((x) => x.state === RemoteFeedState.ready);
  }

  /** @internal */
  trackByFeedId(index: number, remoteFeed: RemoteFeed): string {
    return remoteFeed.id;
  }

  /** @internal */
  get selfVideoHeight(): number {
    if (this.mode === 'grid') {
      return this.videoHeight;
    } else {
      return this.speakerHeight / 5;
    }
  }

  /** @internal */
  get selfVideoWidth(): number {
    if (this.mode === 'grid') {
      return this.videoWidth;
    } else {
      return this.speakerWidth / 5;
    }
  }

  /** @internal */
  setupSubscriptions(): void {
    // Compute video width whenever the window is resized
    this.resizeObservable$
      .pipe(
        debounce(() => interval(500)),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.computeVideoWidth(this.remoteFeeds.length);
      });

    // Do an initial calculation
    this.computeVideoWidth(0);
  }

  /** Computes the ideal width of each video assuming all videos are the same size.
   * Called whenever the screen is resized or `remoteFeeds` changes
   */
  computeVideoWidth(numRemoteVideos): void {
    if (!this.viewport) {
      return;
    }
    // Adding 1 for our local video
    let numVideos = numRemoteVideos;
    if (this.publishing) {
      numVideos += 1;
    }

    this.videoWidth = this.findIdealWidth(
      this.viewport.nativeElement.offsetWidth,
      this.viewport.nativeElement.offsetHeight,
      numVideos);

    this.videoHeight = this.videoWidth * 3 / 4;

    this.computeSpeakerModeDimensions();

    // The window resize event is outside of angular, so change detection won't
    // automatically pick this up. Smells a bit, but not sure there's a better
    // solution
    this.changeDetector.detectChanges();
  }

  /** @internal */
  computeSpeakerModeDimensions(aspectRatio: number = 4 / 3): void {
    const width = this.viewport.nativeElement.offsetWidth;
    const height = this.viewport.nativeElement.offsetHeight;

    const calculatedWidth = height * aspectRatio;

    if (calculatedWidth > width) {
      this.speakerWidth = width;
    } else {
      this.speakerWidth = calculatedWidth;
    }
    this.speakerHeight = this.speakerWidth * 3 / 4;

    this.selfVideoBottom = (height - (this.speakerWidth / aspectRatio)) / 2;
    this.selfVideoRight = (width - this.speakerWidth) / 2;
  }

  /** @internal */
  findIdealWidth(
    viewportWidth: number,
    viewportHeight: number,
    numVideos: number,
    aspectRatio: number = 4 / 3
  ): number {
    // Do a bisect search for the largest width that will fit in our viewport

    const isValidWidth = ((testWidth: number) => {
      if (testWidth > viewportWidth) {
        return false;
      }
      const numColumns = Math.min(numVideos, Math.floor(viewportWidth / testWidth));
      const numRows = Math.ceil(numVideos / numColumns);
      const testHeight = Math.ceil(testWidth / aspectRatio);

      // console.log('is valid: ', testWidth, testHeight, numColumns, numRows, (testHeight * numRows) <= viewportHeight);

      if ((testHeight * numRows) <= viewportHeight) {
        return true;
      }
      return false;
    });

    // Starting point
    const maxWidth = viewportWidth;
    const minWidth = 1;

    let maxFits = 0;
    let minOver = maxWidth + 1;

    let iterations = 0;
    while (minOver > maxFits + 1) {
      iterations += 1;
      const ptr = Math.floor((maxFits + minOver) / 2);
      if (isValidWidth(ptr)) {
        maxFits = ptr;
      } else {
        minOver = ptr;
      }

      if (iterations > 50) {
        break;
      }
    }

    // console.log('searching', viewportWidth, viewportHeight, numVideos, maxFits);
    return maxFits;
  }
}
