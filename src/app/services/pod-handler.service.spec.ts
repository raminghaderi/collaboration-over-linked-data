import { TestBed } from '@angular/core/testing';

import { PodHandlerService } from './pod-handler.service';

describe('PodHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PodHandlerService = TestBed.get(PodHandlerService);
    expect(service).toBeTruthy();
  });
});
