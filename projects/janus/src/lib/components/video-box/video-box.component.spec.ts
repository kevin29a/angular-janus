
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Store } from '@ngrx/store';
import { VideoBoxComponent } from './video-box.component';

import { RemoteFeedFactory } from '../../factories/janus.factories';

describe('VideoBoxComponent', () => {
  let component: VideoBoxComponent;
  let fixture: ComponentFixture<VideoBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoBoxComponent ],
      providers: [
        {
          provide: Store,
          useValue: null,
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoBoxComponent);
    component = fixture.componentInstance;
    component.remoteFeed = RemoteFeedFactory.build();
    spyOn(component, '_attachMediaStream');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('monitorVideoQuality', () => {
    it('should handle an error correctly -- on stream 1', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'streamError');

      component.remoteFeed.numVideoTracks = 0;
      component.remoteFeed.currentSubstream = 1;

      component.monitorVideoQuality(false);

      expect(component.videoQualityHelper.streamError).toHaveBeenCalledWith(1);
      expect(component.switchSubstream).toHaveBeenCalledWith(0);
    });

    it('should handle a slow link correctly -- on stream 1', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'streamError');

      component.remoteFeed.numVideoTracks = 1;
      component.remoteFeed.currentSubstream = 1;

      component.monitorVideoQuality(true);

      expect(component.videoQualityHelper.streamError).toHaveBeenCalledWith(1);
      expect(component.switchSubstream).toHaveBeenCalledWith(0);
    });

    it('should handle an error correctly -- on stream 0', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'streamError');

      component.remoteFeed.numVideoTracks = 0;
      component.remoteFeed.currentSubstream = 0;

      component.monitorVideoQuality(false);

      expect(component.videoQualityHelper.streamError).toHaveBeenCalledWith(0);
      expect(component.switchSubstream).not.toHaveBeenCalled();
    });

    it('should handle a slowLink correctly -- on stream 0', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'streamError');

      component.remoteFeed.numVideoTracks = 1;
      component.remoteFeed.currentSubstream = 0;

      component.monitorVideoQuality(true);

      expect(component.videoQualityHelper.streamError).toHaveBeenCalledWith(0);
      expect(component.switchSubstream).not.toHaveBeenCalled();
    });

    it('should handle a ping correctly -- no stream change', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'ping').and.returnValue(0);
      spyOn(component.videoQualityHelper, 'streamEnd');

      component.remoteFeed.numVideoTracks = 1;
      component.remoteFeed.currentSubstream = 0;

      component.monitorVideoQuality(false);

      expect(component.videoQualityHelper.ping).toHaveBeenCalledWith(0);
      expect(component.switchSubstream).not.toHaveBeenCalled();
    });

    it('should handle a ping correctly -- stream change recommended', () => {
      spyOn(component, 'switchSubstream');
      spyOn(component.videoQualityHelper, 'ping').and.returnValue(1);
      spyOn(component.videoQualityHelper, 'streamEnd');

      component.remoteFeed.numVideoTracks = 1;
      component.remoteFeed.currentSubstream = 0;

      component.monitorVideoQuality(false);

      expect(component.videoQualityHelper.ping).toHaveBeenCalledWith(0);
      expect(component.switchSubstream).toHaveBeenCalledWith(1);
    });

  });
});
