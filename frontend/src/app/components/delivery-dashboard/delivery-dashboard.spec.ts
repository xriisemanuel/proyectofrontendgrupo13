import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryDashboard } from './delivery-dashboard';

describe('DeliveryDashboard', () => {
  let component: DeliveryDashboard;
  let fixture: ComponentFixture<DeliveryDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
