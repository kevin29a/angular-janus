import { Injectable, OnDestroy } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import { Observable, of, EMPTY } from 'rxjs';
import { switchMap, mergeMap, tap, map, catchError, filter } from 'rxjs/operators';

import { VideoroomState, initialState, reducer } from './reducers/janus.reducers';
import * as actions from './actions/janus.actions';
import {
  AttachRemoteFeedPayload,
  PublishOwnFeedPayload,
  RegisterPayload,
  RequestSubstreamPayload,
} from '../models';
import { JanusService } from '../services/janus.service';
import { IceServer, RoomInfo, RemoteFeed, RemoteFeedState } from '../models/janus.models';
import { JanusAttachCallbackData } from '../models/janus-server.models';


/** @internal */
@Injectable()
export class JanusStore extends ComponentStore<VideoroomState> implements OnDestroy {

  private debug = true;

  constructor(private readonly janusService: JanusService) {
    super(initialState);
  }

  /************************************
   *          Selectors
   ************************************/
  readonly remoteFeeds$: Observable<RemoteFeed[]> = this.select((state: VideoroomState) => {
    return Object.keys(state.remoteFeeds).map(id => state.remoteFeeds[id]);
  });

  readonly readyRemoteFeeds$: Observable<RemoteFeed[]> = this.remoteFeeds$.pipe(
    map((feeds: RemoteFeed[]) => {
      return feeds.filter(feed => feed.state === RemoteFeedState.ready);
    })
  );

  readonly roomInfo$: Observable<RoomInfo> = this.select(state => state.roomInfo);

  readonly state$: Observable<VideoroomState> = this.select(state => state);

  /************************************
   *            Reducers
   ************************************/
  readonly reduce = this.updater((state: VideoroomState, action: actions.JanusAction) => {
    const ret = reducer(state, action);
    this.log('reduce:', action, state, ret);
    return ret;
  });

  readonly resetState = this.updater((state: VideoroomState) => {
    return initialState;
  });

  readonly testAddRemoteFeed = this.updater((state: VideoroomState, remoteFeed: RemoteFeed) => {
    // Used to add a fake remote feed when testing
    return {
      ...state,
      remoteFeeds: {
        ...state.remoteFeeds,
        [remoteFeed.id]: remoteFeed
      }
    };
  });

  /************************************
   *            Effects
   ************************************/
  readonly initialize = this.effect((iceServers$: Observable<IceServer[]>) => {
    return iceServers$.pipe(
      switchMap((iceServers: IceServer[]) => {
        this.log('initialize', iceServers);
        this.reduce(new actions.InitializeJanus(iceServers));
        return this.janusService.init(iceServers)
          .pipe(
            tap(() => this.reduce(new actions.InitializeJanusSuccess())),
            catchError((error) => of(this.reduce(new actions.InitializeJanusFail()))),
          );
      })
    );
  });

  readonly attachVideoRoom = this.effect((url$: Observable<string>) => {
    return url$.pipe(
      switchMap((url: string) => {
        this.log('attach', url);
        this.reduce(new actions.AttachVideoRoom(url));
        return this.janusService.attachVideoRoom(url)
          .pipe(
            tap((data: JanusAttachCallbackData) => {
              this.reduce(new actions.AttachCallback(data));
            }),
            catchError((error) => {
              return of(this.reduce(new actions.AttachVideoRoomFail(error)));
            })
          );
      })
    );
  });

  readonly publishOwnFeed = this.effect((payload$: Observable<PublishOwnFeedPayload>) => {
    return payload$.pipe(
      mergeMap((payload: PublishOwnFeedPayload) => {
        this.log('publishOwnFeed', payload);
        this.reduce(new actions.PublishOwnFeed(payload));
        const {audioDeviceId, videoDeviceId, canvasId, skipVideoCapture} = payload;
        return this.janusService.publishOwnFeed(audioDeviceId, videoDeviceId, canvasId, skipVideoCapture)
          .pipe(
            tap(() => {
              this.reduce(new actions.PublishOwnFeedSuccess());
            }),
            catchError((error) => {
              return of(this.reduce(new actions.PublishOwnFeedFail(error)));
            })
          );
      })
    );
  });

  readonly attachRemoteFeed = this.effect((payload$: Observable<AttachRemoteFeedPayload>) => {
    return payload$.pipe(
      mergeMap((payload: AttachRemoteFeedPayload) => {
        this.log('attachRemoteFeed', payload);
        this.reduce(new actions.AttachRemoteFeed(payload));
        const {feed, roomInfo, pin} = payload;
        return this.janusService.attachRemoteFeed(feed, roomInfo, pin)
          .pipe(
            tap((data: JanusAttachCallbackData) => {
              this.reduce(new actions.AttachCallback(data));
            }),
            catchError((error) => {
              this.reduce(new actions.AttachRemoteFeedFail({feed, error}));
              return EMPTY;
            })
          );
      })
    );
  });

  readonly register = this.effect((payload$: Observable<RegisterPayload>) => {
    return payload$.pipe(
      tap((payload: RegisterPayload) => {
        const {name, userId, roomId, pin} = payload;
        this.log('register', payload);
        this.reduce(new actions.Register(payload));
        this.janusService.register(name, userId, roomId, pin);
      })
    );
  });

  readonly requestSubstream = this.effect((payload$: Observable<RequestSubstreamPayload>) => {
    return payload$.pipe(
      tap((payload: RequestSubstreamPayload) => {
        const {feed, substreamId} = payload;
        this.log('requestSubstream', payload);
        this.reduce(new actions.RequestSubstream({feed, substreamId}));
        this.janusService.requestSubstream(feed, substreamId);
      })
    );
  });

  readonly setMute = this.effect((muted$: Observable<boolean>) => {
    return muted$.pipe(
      tap((muted: boolean) => {
        this.log('setMute', muted);
        try {
          const realMuted = this.janusService.setMute(muted);
          this.reduce(new actions.ToggleMuteSuccess(realMuted));
        } catch (error) {
          // This can fail if we set the mute before everything is loaded. Ignoring for now as it will work fine after the fact.
        }
      })
    );
  });

  readonly reset = this.effect((iceServers$: Observable<IceServer[]>) => {
    return iceServers$.pipe(
      tap((iceServers: IceServer[]) => {
        this.janusService.destroy();
        this.resetState();
        this.initialize(iceServers);
      })
    );
  });

  attachMediaStream(elemId, streamId): void {
    this.log('attachMediaStream', elemId, streamId);
    this.janusService.attachMediaStream(elemId, streamId);
  }

  ngOnDestroy(): void {
    this.janusService.destroy();
  }

  log(msg: any, ...args: any[]): void {
    if (this.debug){
      console.log(msg, ...args);
    }
  }
}
