import { TestBed } from '@angular/core/testing';

import { OpenfoodService } from './openfood.service';

describe('OpenfoodService', () => {
  let service: OpenfoodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenfoodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
