import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainNavigation } from './main-navigation';

describe('MainNavigation', () => {
  let component: MainNavigation;
  let fixture: ComponentFixture<MainNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavigation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainNavigation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
