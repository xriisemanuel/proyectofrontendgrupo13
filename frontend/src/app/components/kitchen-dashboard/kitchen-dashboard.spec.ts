import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenDashboard } from './kitchen-dashboard';

describe('KitchenDashboard', () => {
  let component: KitchenDashboard;
  let fixture: ComponentFixture<KitchenDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitchenDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
