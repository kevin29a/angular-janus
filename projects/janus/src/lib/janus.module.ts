import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// ngrx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { JanusComponent } from './janus.component';

import { reducers, effects } from './store';

import { JanusVideoroomComponent } from './containers/janus-videoroom/janus-videoroom.component';
import * as fromComponents from './components';


@NgModule({
  declarations: [
    JanusVideoroomComponent,
    fromComponents.components,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature('janus', reducers),
    EffectsModule.forFeature(effects),
  ],
  exports: [JanusVideoroomComponent]
})
export class JanusModule { }
