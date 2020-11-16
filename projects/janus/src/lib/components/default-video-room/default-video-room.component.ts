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

import { fromEvent, Observable, Subscription, interval } from 'rxjs';
import { debounce, withLatestFrom } from 'rxjs/operators';

import { PublishOwnFeedPayload } from '../../store/actions/janus.actions';

import {
  Devices,
  JanusRole,
  RemoteFeed,
  RemoteFeedState,
  RoomInfo,
  RoomInfoState,
} from '../../models/janus.models';

@Component({
  selector: 'janus-default-video-room',
  templateUrl: './default-video-room.component.html',
  styleUrls: ['./default-video-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultVideoRoomComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() roomInfo: RoomInfo;
  @Input() remoteFeeds$: Observable<RemoteFeed[]>;
  @Input() role: JanusRole;
  @Input() devices: Devices;

  @Output()
  kickUser = new EventEmitter<RemoteFeed>();

  @Output()
  requestSubstream = new EventEmitter<{feed: RemoteFeed, substreamId: number}>();

  @Output()
  publishOwnFeed = new EventEmitter<PublishOwnFeedPayload>();

  @ViewChild('viewport') viewport: ElementRef;

  // Resize events
  private resizeObservable$: Observable<Event>;

  // subscriptions
  private subs: { [id: string]: Subscription } = {};

  public videoWidth = 0;
  public videoHeight = 0;
  public speakerWidth = 0;
  public speakerHeight = 0;

  public selfVideoRight = 0;
  public selfVideoBottom = 0;

  public mode: 'grid' | 'speaker' = 'grid';
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
    for (const key of Object.keys(this.subs)) {
      this.subs[key].unsubscribe();
    }
  }

  get publishing(): boolean {
    return this.role === 'admin' || this.role === 'publisher';
  }

  onKickUser(remoteFeed: RemoteFeed): void {
    this.kickUser.emit(remoteFeed);
  }

  onMaximize(remoteFeed: RemoteFeed): void {
    if (this.mode === 'grid') {
      this.speaker = remoteFeed;
      this.mode = 'speaker';
    } else {
      this.mode = 'grid';
    }
  }

  onRequestSubstream(event: {feed: RemoteFeed, substreamId: number}): void {
    this.requestSubstream.emit(event);
  }

  onPublishOwnFeed(event: PublishOwnFeedPayload): void {
    this.publishOwnFeed.emit(event);
  }

  trackByFeedId(index: number, remoteFeed: RemoteFeed): string {
    return remoteFeed.id;
  }

  get selfVideoHeight(): number {
    if (this.mode === 'grid') {
      return this.videoHeight;
    } else {
      return this.speakerHeight / 5;
    }
  }

  get selfVideoWidth(): number {
    if (this.mode === 'grid') {
      return this.videoWidth;
    } else {
      return this.speakerWidth / 5;
    }
  }

  setupSubscriptions(): void {
    // Compute video width whenever the window is resized
    this.subs[`resize`] = this.resizeObservable$
      .pipe(
        debounce(() => interval(500)),
        withLatestFrom(this.remoteFeeds$),
      )
      .subscribe(([event, remoteFeeds]) => {
        this.computeVideoWidth(remoteFeeds.length);

        // The window resize event is outside of angular, so change detection won't
        // automatically pick this up. Smells a bit, but not sure there's a better
        // solution
        this.changeDetector.detectChanges();
      });

    // Compute video width whenever the remote feeds change
    this.subs[`remoteFeeds`] = this.remoteFeeds$
      .subscribe((remoteFeeds) => {
        this.computeVideoWidth(remoteFeeds.length);
      });

    // Do an initial calculation
    this.computeVideoWidth(0);
  }

  computeVideoWidth(numRemoteVideos): void {
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
  }

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
