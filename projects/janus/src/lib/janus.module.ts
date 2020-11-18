import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JanusVideoroomComponent } from './containers/janus-videoroom/janus-videoroom.component';
import { AudioBoxComponent } from './components/audio-box/audio-box.component';
import { DefaultVideoRoomComponent } from './components/default-video-room/default-video-room.component';
import { SelfVideoComponent } from './components/self-video/self-video.component';
import { VideoBoxComponent } from './components/video-box/video-box.component';


@NgModule({
  declarations: [
    JanusVideoroomComponent,
    AudioBoxComponent,
    DefaultVideoRoomComponent,
    SelfVideoComponent,
    VideoBoxComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [JanusVideoroomComponent]
})
export class JanusModule { }
