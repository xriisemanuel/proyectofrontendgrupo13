import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComboFormComponent } from './combo-form.component';

describe('ComboFormComponent', () => {
  let component: ComboFormComponent;
  let fixture: ComponentFixture<ComboFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComboFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
