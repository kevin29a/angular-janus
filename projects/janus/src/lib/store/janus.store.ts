import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import { Observable, of, EMPTY } from 'rxjs';
import { switchMap, mergeMap, tap, map, catchError, filter } from 'rxjs/operators';

import { VideoroomState, initialState, reducer } from './reducers/janus.reducers';
import * as actions from './actions/janus.actions';
import { JanusService } from '../services/janus.service';
import { JanusEnvironment, RoomInfo, RemoteFeed, RemoteFeedState } from '../models/janus.models';
import { JanusAttachCallbackData } from '../models/janus-server.models';


@Injectable()
export class JanusStore extends ComponentStore<VideoroomState> {

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
    console.log('reduce:', action, state, ret);
    return ret;
  });

  /************************************
   *            Effects
   ************************************/
  readonly initialize = this.effect((environment$: Observable<JanusEnvironment>) => {
    return environment$.pipe(
      switchMap((environment: JanusEnvironment) => {
        this.log('initialize', environment);
        this.reduce(new actions.InitializeJanus(environment));
        return this.janusService.init(environment)
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
        this.log('attache', url);
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

  readonly publishOwnFeed = this.effect((payload$: Observable<actions.PublishOwnFeedPayload>) => {
    return payload$.pipe(
      mergeMap((payload: actions.PublishOwnFeedPayload) => {
        this.log('publishOwnFeed', payload);
        this.reduce(new actions.PublishOwnFeed(payload));
        const {audioDeviceId, videoDeviceId, canvasId} = payload;
        return this.janusService.publishOwnFeed(audioDeviceId, videoDeviceId, canvasId)
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

  readonly attachRemoteFeed = this.effect((payload$: Observable<actions.AttachRemoteFeedPayload>) => {
    return payload$.pipe(
      mergeMap((payload: actions.AttachRemoteFeedPayload) => {
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

  readonly toggleMute = this.effect((obs$: Observable<null>) => {
    return obs$.pipe(
      tap(() => {
        this.log('toggleMute');
        const muted = this.janusService.toggleMute();
        this.reduce(new actions.ToggleMuteSuccess(muted));
      })
    );
  });

  /************************************
   *     Effects without dispatch
   ************************************/
  destroy(): void {
    this.log('destroy');
    this.reduce(new actions.DestroyJanus());
    this.janusService.destroy();
  }

  register(name, userId, roomId, pin): void {
    this.log('register', name, userId, roomId, pin);
    this.reduce(new actions.Register({name, userId, roomId, pin}));
    this.janusService.register(name, userId, roomId, pin);
  }

  attachMediaStream(elemId, streamId): void {
    this.log('attachMediaStream', elemId, streamId);
    this.janusService.attachMediaStream(elemId, streamId);
  }

  requestSubstream(feed: RemoteFeed, substreamId: number): void {
    this.log('requestSubstream', feed, substreamId);
    this.reduce(new actions.RequestSubstream({feed, substreamId}));
    this.janusService.requestSubstream(feed, substreamId);
  }

  log(msg: any, ...args: any[]): void {
    console.log(msg, ...args);
  }

}
