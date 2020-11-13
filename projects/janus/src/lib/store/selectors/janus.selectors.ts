import { createSelector } from '@ngrx/store';

import { RemoteFeed, RemoteFeedState } from '../../models/janus.models';

import * as fromReducers from '../reducers';
import * as fromJanusReducers from '../reducers/janus.reducers';

export const getVideoroomState = createSelector(
  fromReducers.getJanusState,
  (state: fromReducers.JanusState) => state.videoroom
);

export const getRoomInfo = createSelector(
  getVideoroomState,
  (state: fromJanusReducers.VideoroomState) => {
    return state.roomInfo;
  },
);

export const getRemoteFeedEntities = createSelector(
  getVideoroomState,
  (state: fromJanusReducers.VideoroomState) => state.remoteFeeds,
);

export const getAllRemoteFeeds = createSelector(
  getRemoteFeedEntities,
  (entities) => Object.keys(entities).map(id => entities[id])
);

export const getReadyRemoteFeeds = createSelector(
  getAllRemoteFeeds,
  (feeds: RemoteFeed[]) => feeds.filter(feed => feed.state === RemoteFeedState.ready)
);
