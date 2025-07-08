import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaDetailModal } from './oferta-detail-modal';

describe('OfertaDetailModal', () => {
  let component: OfertaDetailModal;
  let fixture: ComponentFixture<OfertaDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertaDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
