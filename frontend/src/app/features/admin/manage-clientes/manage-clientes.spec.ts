import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageClientes } from './manage-clientes';

describe('ManageClientes', () => {
  let component: ManageClientes;
  let fixture: ComponentFixture<ManageClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
