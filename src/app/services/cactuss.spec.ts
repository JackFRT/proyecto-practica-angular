import { TestBed } from '@angular/core/testing';

import { Cactuss } from './cactuss';

describe('Cactuss', () => {
  let service: Cactuss;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cactuss);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
