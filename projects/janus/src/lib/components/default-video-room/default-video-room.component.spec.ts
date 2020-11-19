import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DefaultVideoRoomComponent } from './default-video-room.component';
import { RoomInfoState, PublishState } from '../../models/janus.models';
import { RoomInfoFactory } from '../../factories/janus.factories';

describe('DefaultVideoRoomComponent', () => {
  let component: DefaultVideoRoomComponent;
  let fixture: ComponentFixture<DefaultVideoRoomComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DefaultVideoRoomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {

    fixture = TestBed.createComponent(DefaultVideoRoomComponent);
    component = fixture.componentInstance;
    component.roomInfo = RoomInfoFactory.build();

    spyOn(component, 'setupSubscriptions');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('findIdealWidth', () => {
    it('single video -- width bound', () => {
      const width = component.findIdealWidth(100, 100, 1);
      expect(width).toEqual(100);
    });

    it('single video -- height bound', () => {
      const width = component.findIdealWidth(100, 50, 1);
      expect(width).toEqual(66);
    });

    it('perfect 4x4 grid', () => {
      const width = component.findIdealWidth(200, 150, 4);
      expect(width).toEqual(100);
    });

    it('4x4 grid with gutter on sides', () => {
      const width = component.findIdealWidth(250, 150, 4);
      expect(width).toEqual(100);
    });

    it('4x4 grid with gutter on top/bottom', () => {
      const width = component.findIdealWidth(200, 175, 4);
      expect(width).toEqual(100);
    });

    it('4x4 grid with only 3 videos', () => {
      const width = component.findIdealWidth(200, 150, 3);
      expect(width).toEqual(100);
    });

    it('perfect 5x2 grid', () => {
      const width = component.findIdealWidth(500, 150, 10);
      expect(width).toEqual(100);
    });

    it('5x2 grid -- gutter on sides', () => {
      const width = component.findIdealWidth(625, 150, 10);
      expect(width).toEqual(100);
    });

    it('5x2 grid -- gutter on top/bottom', () => {
      const width = component.findIdealWidth(500, 200, 10);
      expect(width).toEqual(100);
    });

    it('live example 1164 1104 3. Should return 1164/2', () => {
      const width = component.findIdealWidth(1164, 1104, 3);
      expect(width).toEqual(1164 / 2);
    });

    it('live example 1164 1104 2. Should return 1164/2', () => {
      const width = component.findIdealWidth(1164, 1104, 2);
      expect(width).toEqual(1104 / 2 * 4 / 3);
    });
  });
});
