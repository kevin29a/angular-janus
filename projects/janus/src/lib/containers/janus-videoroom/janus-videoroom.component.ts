import * as moment from 'moment';

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { first, startWith, shareReplay, takeUntil, switchMap } from 'rxjs/operators';
import { Observable, Subject, combineLatest } from 'rxjs';

import {
  Devices,
  JanusRole,
  PublishState,
  Publisher,
  RemoteFeed,
  RemoteFeedState,
  RoomInfo,
  RoomInfoState,
  JanusEnvironment,
} from '../../models/janus.models';

import { PublishOwnFeedPayload } from '../../store/actions/janus.actions';
import { JanusStore } from '../../store/janus.store';
import { JanusErrors } from '../../models/janus-server.models';

@Component({
  selector: 'janus-videoroom',
  templateUrl: './janus-videoroom.component.html',
  styleUrls: ['./janus-videoroom.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [JanusStore],
})
export class JanusVideoroomComponent implements OnInit, OnDestroy {

  @Input()
  roomId: string;

  @Input()
  privateData: any;

  @Input()
  userId: string;

  @Input()
  userName: string;

  @Input()
  set isMuted(muted: boolean) {
    this.muted = muted;
    this._setMuted(muted);
  }

  @Input()
  role: JanusRole = JanusRole.publisher;

  @Input()
  devices: Devices;

  @Input()
  environment: JanusEnvironment;

  @Output()
  janusError = new EventEmitter<{ code: number, message: string }>();

  @Output()
  publishers = new EventEmitter<Publisher[]>();

  roomInfo$: Observable<RoomInfo>;
  remoteFeeds$: Observable<RemoteFeed[]>;

  private muted: boolean;
  private destroy$ = new Subject();
  private janusServerUrl: string;

  constructor(
    private readonly janusStore: JanusStore
  ) { }

  ngOnInit(): void {
    // Initialize variables and load the room/user

    this.janusServerUrl = this.environment.janusServer.wsUrl;

    this.remoteFeeds$ = this.janusStore.readyRemoteFeeds$.pipe(
      shareReplay(1),
    );

    this.roomInfo$ = this.janusStore.roomInfo$.pipe(
      shareReplay(1)
    );

    const pin = this.privateData ? this.privateData.pin : null;
    this.setupJanusRoom(this.roomId, this.userId, this.userName, pin);

    // @ts-ignore
    if (window.Cypress) {
      // @ts-ignore
      window.janusStore = this.janusStore;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.janusStore.destroy();
  }

  _setMuted(muted: boolean): void {
    this.janusStore.setMute(muted);
  }

  emitRemoteFeeds(remoteFeeds: RemoteFeed[]): void {
    const publishers: Publisher[] = remoteFeeds.filter((feed) => feed.state === RemoteFeedState.ready);
    this.publishers.emit(publishers);
  }

  attachRemoteFeeds(remoteFeeds: RemoteFeed[], roomInfo: RoomInfo, pin: string): void {
    // Attach remote feeds

    for (const feed of remoteFeeds) {
      if (feed.state === RemoteFeedState.initialized) {

        this.janusStore.attachRemoteFeed({
          roomInfo,
          feed,
          pin,
        });
        // Only fire one dispatch per subscribe
        break;
      }
    }
  }

  setupJanusRoom(roomId: string, userId: string, userName: string, pin: string): void {
    // Setup comms with janus server

    this.janusStore.initialize(this.environment);

    const allRemoteFeeds$: Observable<RemoteFeed[]> = this.janusStore.remoteFeeds$.pipe(
      startWith([])
    );
    this.janusStore.state$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(({roomInfo, remoteFeeds}) => {

      const remoteFeedsArray = Object.keys(remoteFeeds).map(id => remoteFeeds[id]);
      if (roomInfo.muted !== this.muted) {
        this._setMuted(this.muted);
      }
      if (roomInfo.publishState === PublishState.error) {
        const message = JanusErrors[roomInfo.errorCode].message;
        this.janusError.emit({code: roomInfo.errorCode, message});
      }

      this.attachRemoteFeeds(remoteFeedsArray, roomInfo, pin);
      this.emitRemoteFeeds(remoteFeedsArray);

      switch (roomInfo.state) {
        case RoomInfoState.initialized: {
          this.janusStore.attachVideoRoom(this.janusServerUrl);
          break;
        }
        case RoomInfoState.attached: {
          this.janusStore.register(
            userName,
            userId,
            roomId,
            pin,
          );
          break;
        }
        case RoomInfoState.attach_failed: {
          if (this.janusServerUrl !== this.environment.janusServer.httpUrl) {
            this.janusServerUrl = this.environment.janusServer.httpUrl;
            this.janusStore.attachVideoRoom(this.janusServerUrl);
          } else {
            this.janusError.emit({code: 9999, message: 'Unable to connect to media server'});
          }
          break;
        }
      }
    });
  }

  onPublishOwnFeed(payload: PublishOwnFeedPayload): void {
    this.janusStore.publishOwnFeed(payload);
  }

  onRequestSubstream(payload: {feed: RemoteFeed, substreamId: number}): void {
    const {feed, substreamId} = payload;
    this.janusStore.requestSubstream(feed, substreamId);
  }
}
