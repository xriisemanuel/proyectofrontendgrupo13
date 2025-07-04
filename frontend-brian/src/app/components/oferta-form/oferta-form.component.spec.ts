import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaFormComponent } from './oferta-form.component';

describe('OfertaFormComponent', () => {
  let component: OfertaFormComponent;
  let fixture: ComponentFixture<OfertaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OfertaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
