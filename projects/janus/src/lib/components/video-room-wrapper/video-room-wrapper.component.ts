import {
  ChangeDetectionStrategy,
  ComponentFactoryResolver,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Type,
  ViewChild,
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DefaultVideoRoomComponent } from '../default-video-room/default-video-room.component';
import { PublishOwnFeedPayload, RequestSubstreamPayload, VideoRoomComponent } from '../../models';
import { VideoRoomWrapperDirective } from './video-room-wrapper.directive';

import {
  Devices,
  JanusRole,
  RemoteFeed,
  RoomInfo,
} from '../../models/janus.models';

@Component({
  selector: 'janus-video-room-wrapper',
  templateUrl: './video-room-wrapper.component.html',
  styleUrls: ['./video-room-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoRoomWrapperComponent implements OnInit, OnDestroy, OnChanges {

  @Input() roomInfo: RoomInfo;
  @Input() role: JanusRole;
  @Input() devices?: Devices;
  @Input() remoteFeeds: RemoteFeed[];

  @Input() component?: Type<VideoRoomComponent>;

  @Output()
  requestSubstream = new EventEmitter<{feed: RemoteFeed, substreamId: number}>();

  @Output()
  publishOwnFeed = new EventEmitter<PublishOwnFeedPayload>();

  @ViewChild(VideoRoomWrapperDirective, {static: true}) janusVideoRoomWrapper: VideoRoomWrapperDirective;

  private destroy$ = new Subject();
  private componentRef: any;
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit(): void {
    this.loadComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.componentRef) {
      this.syncComponentData();
    }
  }

  loadComponent(): void {
    const componentClass = this.component ? this.component : DefaultVideoRoomComponent;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentClass);
    const viewContainerRef = this.janusVideoRoomWrapper.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent<VideoRoomComponent>(componentFactory);

    // Listen to the event and emit them here
    this.componentRef.instance.publishOwnFeed.pipe(
      takeUntil(this.destroy$),
    ).subscribe((payload: PublishOwnFeedPayload) => {
      this.publishOwnFeed.emit(payload);
    });

    this.componentRef.instance.requestSubstream.pipe(
      takeUntil(this.destroy$),
    ).subscribe((payload: any) => {
      this.requestSubstream.emit(payload);
    });

    this.syncComponentData();
  }

  syncComponentData(): void {
    this.componentRef.instance.roomInfo = this.roomInfo;
    this.componentRef.instance.role = this.role;
    this.componentRef.instance.devices = this.devices;
    this.componentRef.instance.remoteFeeds = this.remoteFeeds;
  }

  onPublishOwnFeed(payload: PublishOwnFeedPayload): void {
    this.publishOwnFeed.emit(payload);
  }

  onRequestSubstream(payload: RequestSubstreamPayload): void {
    this.requestSubstream.emit(payload);
  }
}
