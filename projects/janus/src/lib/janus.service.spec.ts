import { TestBed } from '@angular/core/testing';

import { JanusService } from './janus.service';

describe('JanusService', () => {
  let service: JanusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JanusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
