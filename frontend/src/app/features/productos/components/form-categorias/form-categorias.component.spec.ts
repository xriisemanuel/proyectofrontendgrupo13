import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCategoriasComponent } from './form-categorias.component';

describe('FormCategoriasComponent', () => {
  let component: FormCategoriasComponent;
  let fixture: ComponentFixture<FormCategoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCategoriasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
