import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersByRol } from './manage-users-by-rol';

describe('ManageUsersByRol', () => {
  let component: ManageUsersByRol;
  let fixture: ComponentFixture<ManageUsersByRol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageUsersByRol]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUsersByRol);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
