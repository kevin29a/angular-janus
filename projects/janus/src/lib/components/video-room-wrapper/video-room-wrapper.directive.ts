import { Directive, ViewContainerRef } from '@angular/core';

/** @internal */
@Directive({
  selector: '[janusVideoRoomWrapper]',
})
export class VideoRoomWrapperDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
