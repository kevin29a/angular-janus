import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JanusComponent } from './janus.component';

import { JanusVideoroomComponent } from './containers/janus-videoroom/janus-videoroom.component';
import * as fromComponents from './components';


@NgModule({
  declarations: [
    JanusVideoroomComponent,
    fromComponents.components,
  ],
  imports: [
    CommonModule,
  ],
  exports: [JanusVideoroomComponent]
})
export class JanusModule { }
