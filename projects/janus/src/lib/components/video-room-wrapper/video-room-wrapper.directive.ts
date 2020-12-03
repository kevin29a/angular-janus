import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[janusVideoRoomWrapper]',
})
export class VideoRoomWrapperDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
