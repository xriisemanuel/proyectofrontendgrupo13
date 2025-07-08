import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSupervisoresCocina } from './manage-supervisores-cocina';

describe('ManageSupervisoresCocina', () => {
  let component: ManageSupervisoresCocina;
  let fixture: ComponentFixture<ManageSupervisoresCocina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSupervisoresCocina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSupervisoresCocina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
