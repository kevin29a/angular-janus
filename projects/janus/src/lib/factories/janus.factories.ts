// @ts-ignore
import * as Factory from 'factory.ts';

import {
  RemoteFeed,
  RemoteFeedState,
  RoomInfo,
  RoomInfoState,
  PublishState,
} from '../models/janus.models';

export const RemoteFeedFactory = Factory.Sync.makeFactory<RemoteFeed>({
  state: RemoteFeedState.initialized,
  id: Factory.each(i => i.toString()),
  streamId: Factory.each(i => 'stream' + i.toString()),
  numVideoTracks: 0,
  requestedSubstream: 0,
  currentSubstream: 0,
  displayName: Factory.each(i => 'name' + i.toString()),
  audio_codec: Factory.each(i => 'audio' + i.toString()),
  video_codec: Factory.each(i => 'video' + i.toString()),
  muted: false,
  volume: 64,
  slowLink: null,
});

export const RoomInfoFactory = Factory.Sync.makeFactory<RoomInfo>({
  state: RoomInfoState.start,
  id: Factory.each(i => i.toString()),
  description: Factory.each(i => 'description' + i.toString()),
  privateId: Factory.each(i => i),
  otherRoomId: Factory.each(i => i),
  errorCode: null,
  publishState: PublishState.start,
  localStreamId: Factory.each(i => 'stream' + i.toString()),
  muted: false,
});
