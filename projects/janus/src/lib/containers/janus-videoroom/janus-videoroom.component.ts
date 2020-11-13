import * as moment from 'moment';

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { first, startWith, shareReplay, takeUntil, switchMap } from 'rxjs/operators';
import { Observable, Subject, combineLatest } from 'rxjs';
import { Store } from '@ngrx/store';

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
import * as fromStore from '../../store';

import { JanusErrors } from '../../models/janus-server.models';

@Component({
  selector: 'janus-janus-videoroom',
  templateUrl: './janus-videoroom.component.html',
  styleUrls: ['./janus-videoroom.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JanusVideoroomComponent implements OnInit, OnDestroy, OnChanges {

  @Input()
  roomId: string;

  @Input()
  privateData: any;

  @Input()
  userId: string;

  @Input()
  userName: string;

  @Input()
  isMuted: boolean;

  @Input()
  role: JanusRole = JanusRole.publisher;

  @Input()
  devices: Devices;

  @Input()
  environment: JanusEnvironment;

  @Output()
  kickUser = new EventEmitter<{publisherId: string, displayName: string}>();

  @Output()
  janusError = new EventEmitter<{ code: number, message: string }>();

  @Output()
  publishers = new EventEmitter<Publisher[]>();

  roomInfo$: Observable<RoomInfo>;
  remoteFeeds$: Observable<RemoteFeed[]>;

  private roomInfoMuted: boolean;
  private destroy$ = new Subject();
  private janusServerUrl: string;

  constructor(
    private store: Store<fromStore.JanusState>,
  ) { }

  ngOnInit(): void {
    // Initialize variables and load the room/user

    this.janusServerUrl = this.environment.janusServer.wsUrl;

    this.remoteFeeds$ = this.store.select(fromStore.getReadyRemoteFeeds).pipe(
      shareReplay(1),
    );
    this.roomInfo$ = this.store.select(fromStore.getRoomInfo).pipe(
      shareReplay(1)
    );

    const pin = this.privateData ? this.privateData.pin : null;
    this.setupJanusRoom(this.roomId, this.userId, this.userName, pin);

    // @ts-ignore
    if (window.Cypress) {
      // @ts-ignore
      window.janusStore = this.store;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(new fromStore.DestroyJanus());
  }

  ngOnChanges(changes): void {
    if ('isMuted' in changes && this.roomInfo$) {
      this._syncIsMuted();
    }
  }

  _syncIsMuted(): void {
    // Determine if we need to sync up isMuted

    if (!this.roomInfo$) { return; }
    this.roomInfo$.pipe(first()).subscribe((roomInfo) => {
      if (
        this.isMuted !== roomInfo.muted
        && roomInfo.publishState === PublishState.publishing
      ) {
        this.store.dispatch(new fromStore.ToggleMute());
      }
    });
  }

  emitRemoteFeeds(remoteFeeds: RemoteFeed[]): void {
    const publishers: Publisher[] = remoteFeeds.filter((feed) => feed.state === RemoteFeedState.ready);
    this.publishers.emit(publishers);
  }

  attachRemoteFeeds(remoteFeeds: RemoteFeed[], roomInfo: RoomInfo, pin: string): void {
    // Attach remote feeds

    for (const feed of remoteFeeds) {
      if (feed.state === RemoteFeedState.initialized) {

        this.store.dispatch(new fromStore.AttachRemoteFeed({
          roomInfo,
          feed,
          pin,
        }));
        // Only fire one dispatch per subscribe
        break;
      }
    }
  }

  setupJanusRoom(roomId: string, userId: string, userName: string, pin: string): void {
    // Setup comms with janus server

    this.store.dispatch(new fromStore.InitializeJanus(this.environment));

    const allRemoteFeeds$: Observable<RemoteFeed[]> = this.store.select(fromStore.getAllRemoteFeeds).pipe(
      startWith([])
    );
    combineLatest(this.roomInfo$, allRemoteFeeds$).pipe(
      takeUntil(this.destroy$),
    ).subscribe(([roomInfo, remoteFeeds]) => {
      this._syncIsMuted();
      if (roomInfo.publishState === PublishState.error) {
        const message = JanusErrors[roomInfo.errorCode].message;
        this.janusError.emit({code: roomInfo.errorCode, message});
      }

      this.attachRemoteFeeds(remoteFeeds, roomInfo, pin);
      this.emitRemoteFeeds(remoteFeeds);

      switch (roomInfo.state) {
        case RoomInfoState.initialized: {
          this.store.dispatch(new fromStore.AttachVideoRoom(this.janusServerUrl));
          break;
        }
        case RoomInfoState.attached: {
          this.store.dispatch(new fromStore.Register({
            name: userName,
            pin,
            userId,
            roomId,
          }));
          break;
        }
        case RoomInfoState.attach_failed: {
          if (this.janusServerUrl !== this.environment.janusServer.httpUrl) {
            this.janusServerUrl = this.environment.janusServer.httpUrl;
            this.store.dispatch(new fromStore.AttachVideoRoom(this.janusServerUrl));
          } else {
            this.janusError.emit({code: 9999, message: 'Unable to connect to media server'});
          }
          break;
        }
      }
    });
  }

  onKickUser(remoteFeed: RemoteFeed): void {
    this.kickUser.emit({publisherId: remoteFeed.id, displayName: remoteFeed.displayName});
  }
}
