import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRoomWrapperComponent } from './video-room-wrapper.component';

describe('VideoRoomWrapperComponent', () => {
  let component: VideoRoomWrapperComponent;
  let fixture: ComponentFixture<VideoRoomWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoRoomWrapperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoRoomWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
