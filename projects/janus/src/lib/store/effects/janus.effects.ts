import { Injectable } from '@angular/core';

import { Effect, Actions, ofType } from '@ngrx/effects';
import { map, mergeMap, switchMap, catchError, tap, filter } from 'rxjs/operators';
import { from, of } from 'rxjs';


// Local Modules
import * as janusActions from '../actions/janus.actions';
import { JanusService } from '../../services/janus.service';
import { JanusAttachCallbackData, ON_MESSAGE, ON_REMOTE_FEED_MESSAGE } from '../../models/janus-server.models';
import { JanusEnvironment } from '../../models/janus.models';

@Injectable()
export class JanusEffects {
  constructor(
    private actions$: Actions,
    private janusService: JanusService) { }

  @Effect()
  InitializeJanus$ = this.actions$.pipe(
    ofType(janusActions.INITIALIZE_JANUS),
    map((action: janusActions.InitializeJanus) => action.payload),
    switchMap((environment: JanusEnvironment) => {
      return this.janusService.init(environment)
        .pipe(
          map(() => {
            return new janusActions.InitializeJanusSuccess();
          }),
          catchError((error) => {
            return of(new janusActions.InitializeJanusFail());
          })
        );
    })
  );

  @Effect({dispatch: false})
  DestroyJanus$ = this.actions$.pipe(
    ofType(janusActions.DESTROY_JANUS),
    tap(() => {
      this.janusService.destroy();
    })
  );

  @Effect()
  attachVideoRoom$ = this.actions$.pipe(
    ofType(janusActions.ATTACH_VIDEO_ROOM),
    map((action: janusActions.AttachVideoRoom) => action.payload),
    switchMap((url) => {
      return this.janusService.attachVideoRoom(url)
        .pipe(
          map((data: JanusAttachCallbackData) => {
            return new janusActions.AttachCallback(data);
          }),
          catchError((error) => {
            return of(new janusActions.AttachVideoRoomFail(error));
          })
        );
    })
  );

  @Effect({dispatch: false})
  register$ = this.actions$.pipe(
    ofType(janusActions.REGISTER),
    map((action: janusActions.Register) => action.payload),
    tap(({name, userId, roomId, pin}) => {
      this.janusService.register(name, userId, roomId, pin);
    })
  );

  @Effect()
  publishOwnFeed$ = this.actions$.pipe(
    ofType(janusActions.PUBLISH_OWN_FEED),
    map((action: janusActions.PublishOwnFeed) => action.payload),
    switchMap(({audioDeviceId, videoDeviceId, canvasId}) => {
      return this.janusService.publishOwnFeed(audioDeviceId, videoDeviceId, canvasId)
        .pipe(
          map(() => {
            return new janusActions.PublishOwnFeedSuccess();
          }),
          catchError((error) => {
            return of(new janusActions.PublishOwnFeedFail(error));
          })
        );
    })
  );

  @Effect({dispatch: false})
  attachMediaStream$ = this.actions$.pipe(
    ofType(janusActions.ATTACH_MEDIA_STREAM),
    map((action: janusActions.AttachMediaStream) => action.payload),
    tap(({elemId, streamId}) => {
      this.janusService.attachMediaStream(elemId, streamId);
    })
  );

  @Effect()
  attachRemoteFeed$ = this.actions$.pipe(
    ofType(janusActions.ATTACH_REMOTE_FEED),
    map((action: janusActions.AttachRemoteFeed) => action.payload),
    mergeMap(({feed, roomInfo, pin}) => {
      return this.janusService.attachRemoteFeed(feed, roomInfo, pin)
        .pipe(
          map((data: JanusAttachCallbackData) => {
            return new janusActions.AttachCallback(data);
          }),
          catchError((error) => {
            return of(new janusActions.AttachRemoteFeedFail({feed, error}));
          })
        );
    })
  );

  @Effect({dispatch: false})
  answerRemoteFeedJsep$ = this.actions$.pipe(
    ofType(janusActions.ATTACH_CALLBACK),
    map((action: janusActions.AttachCallback) => action.payload),
    filter((actionPayload) => {
      return actionPayload.message === ON_REMOTE_FEED_MESSAGE && !!actionPayload.payload.jsep;
    }),
    tap((actionPayload) => {
      this.janusService.answerRemoteFeedJsep(
        actionPayload.payload.jsep,
        actionPayload.payload.feed,
        actionPayload.payload.room);
      }
    )
  );

  // Some callbacks have jsep state, which is stored in the service
  @Effect({dispatch: false})
  handleRemoteJsep$ = this.actions$.pipe(
    ofType(janusActions.ATTACH_CALLBACK),
    map((action: janusActions.AttachCallback) => action.payload),
    tap((actionPayload) => {
      if (actionPayload.message === ON_MESSAGE && !!actionPayload.payload.jsep) {
        this.janusService.handleRemoteJsep(actionPayload.payload.jsep);
      }
    })
  );

  @Effect()
  toggleMute$ = this.actions$.pipe(
    ofType(janusActions.TOGGLE_MUTE),
    map((action: janusActions.ToggleMute) => {
      // This is synchronous. Just return the success
      const muted = this.janusService.toggleMute();
      return new janusActions.ToggleMuteSuccess(muted);
    })
  );

  @Effect({dispatch: false})
  requestSubstream$ = this.actions$.pipe(
    ofType(janusActions.REQUEST_SUBSTREAM),
    map((action: janusActions.RequestSubstream) => action.payload),
    tap(({feed, substreamId}) => {
      this.janusService.requestSubstream(feed, substreamId);
    })
  );
}
