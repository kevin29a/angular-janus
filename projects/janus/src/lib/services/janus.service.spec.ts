import { TestBed } from '@angular/core/testing';

import { JanusService, WebrtcService } from './janus.service';


describe('JanusService', () => {
  let service: JanusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JanusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('_sizeCanvasElement', () => {
    // Test sizing the canvas element

    it('should handle exactly 4:3 aspect ratio', () => {
      const { canvasWidth, canvasHeight } = service._sizeCanvasElement(640, 480);
      expect(canvasWidth).toEqual(640);
      expect(canvasHeight).toEqual(480);
    });

    it('should handle greater than 4:3 aspect ratio', () => {
      const { canvasWidth, canvasHeight } = service._sizeCanvasElement(1280, 720);
      expect(canvasWidth).toEqual(960);
      expect(canvasHeight).toEqual(720);
    });

    it('should handle less than 4:3 aspect ratio', () => {
      const { canvasWidth, canvasHeight } = service._sizeCanvasElement(720, 960);
      expect(canvasWidth).toEqual(1280);
      expect(canvasHeight).toEqual(960);
    });
  });
});

describe('WebrtcService', () => {
  let service: WebrtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebrtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupportedDevice', () => {
    // Test that we detect if we're on a supported device or not

    it('should accept chrome on linux', () => {
      const version = '5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36';
      expect(service.supportsAppVersion(version)).toBe(true);
    });

    it('should accept null', () => {
      // Kind of a gray area what we should do here. I'm accepting null for now until proven it's a bad idea
      const version = null;
      expect(service.supportsAppVersion(version)).toBe(true);
    });

    it('should accept ios 13.5.1', () => {
      const version = (
        '5.0 (iPod touch; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15'
        + ' (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
      );
      expect(service.supportsAppVersion(version)).toBe(true);
    });

    it('should accept ios 13.0', () => {
      const version = (
        '5.0 (iPod touch; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15'
        + ' (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
      );
      expect(service.supportsAppVersion(version)).toBe(true);
    });

    it('should reject ios 12.4.7', () => {
      const version = (
        '5.0 (iPod touch; CPU iPhone OS 12_4_7 like Mac OS X) AppleWebKit/605.1.15'
        + ' (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
      );
      expect(service.supportsAppVersion(version)).toBe(false);
    });
  });
});
