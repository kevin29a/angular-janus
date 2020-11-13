import { ActionReducerMap, createFeatureSelector } from '@ngrx/store';

import * as janusReducer from './janus.reducers';

export interface JanusState {
  videoroom: janusReducer.VideoroomState;
}

export const reducers: ActionReducerMap<JanusState> = {
  videoroom: janusReducer.reducer,
};

export const getJanusState = createFeatureSelector<JanusState>('janus');
