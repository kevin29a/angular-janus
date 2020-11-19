import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelfVideoComponent } from './self-video.component';
import { WebrtcService } from '../../services/janus.service';
import { RoomInfoFactory } from '../../factories/janus.factories';
import { RoomInfoState, PublishState, Devices } from '../../models/janus.models';

describe('SelfVideoComponent', () => {
  let component: SelfVideoComponent;
  let fixture: ComponentFixture<SelfVideoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelfVideoComponent ],
      providers: [
        { provide: WebrtcService, useValue: null},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfVideoComponent);
    component = fixture.componentInstance;
    component.roomInfo = RoomInfoFactory.build({state: RoomInfoState.joined});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('change devices', () => {
    it('should publish a new feed if the input devices have not been previously specified', () => {
      spyOn(component, '_publishOwnFeed');
      component.roomInfo = RoomInfoFactory.build({state: RoomInfoState.joined, publishState: PublishState.ready});

      const oldDevices = null;
      const newDevices: Devices = {
        audioDeviceId: 'a-id',
        videoDeviceId: 'v-id',
        speakerDeviceId: null,
      };

      component.onDevicesChange(oldDevices, newDevices);

      expect(component._publishOwnFeed).toHaveBeenCalledWith('a-id', 'v-id');
    });

    it('should re-publish if the input devices have not been previously specified', () => {
      spyOn(component, '_publishOwnFeed');
      component.roomInfo = RoomInfoFactory.build({state: RoomInfoState.joined, publishState: PublishState.publishing});

      const oldDevices = null;
      const newDevices: Devices = {
        audioDeviceId: 'a-id',
        videoDeviceId: 'v-id',
        speakerDeviceId: null,
      };

      component.onDevicesChange(oldDevices, newDevices);

      expect(component._publishOwnFeed).toHaveBeenCalledWith('a-id', 'v-id');
    });

    it('should not publish a new feed if the input devices are the same', () => {
      spyOn(component, '_publishOwnFeed');
      component.roomInfo = RoomInfoFactory.build({state: RoomInfoState.joined, publishState: PublishState.publishing});

      const oldDevices: Devices = {
        audioDeviceId: 'a-id',
        videoDeviceId: 'v-id',
        speakerDeviceId: null,
      };
      const newDevices: Devices = {
        ...oldDevices,
      };

      component.onDevicesChange(oldDevices, newDevices);

      expect(component._publishOwnFeed).not.toHaveBeenCalled();
    });

    it('should publish a new feed if the input devices have changed', () => {
      spyOn(component, '_publishOwnFeed');
      component.roomInfo = RoomInfoFactory.build({state: RoomInfoState.joined, publishState: PublishState.publishing});

      const oldDevices: Devices = {
        audioDeviceId: 'a-id',
        videoDeviceId: 'v-id',
        speakerDeviceId: null,
      };
      const newDevices: Devices = {
        ...oldDevices,
        videoDeviceId: 'v-id2',
      };

      component.onDevicesChange(oldDevices, newDevices);

      expect(component._publishOwnFeed).toHaveBeenCalledWith('a-id', 'v-id2');
    });
  });
});
