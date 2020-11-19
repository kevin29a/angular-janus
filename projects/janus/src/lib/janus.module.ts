import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


import { JanusVideoroomComponent } from './containers/janus-videoroom/janus-videoroom.component';
import { DeviceSelectorComponent } from './containers/device-selector/device-selector.component';
import { AudioBoxComponent } from './components/audio-box/audio-box.component';
import { DefaultVideoRoomComponent } from './components/default-video-room/default-video-room.component';
import { SelfVideoComponent } from './components/self-video/self-video.component';
import { VideoBoxComponent } from './components/video-box/video-box.component';


@NgModule({
  declarations: [
    JanusVideoroomComponent,
    DeviceSelectorComponent,
    AudioBoxComponent,
    DefaultVideoRoomComponent,
    SelfVideoComponent,
    VideoBoxComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  exports: [
    JanusVideoroomComponent,
    DeviceSelectorComponent,
  ]
})
export class JanusModule { }
