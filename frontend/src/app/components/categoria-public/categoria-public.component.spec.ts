import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaPublicComponent } from './categoria-public.component';

describe('CategoriaPublicComponent', () => {
  let component: CategoriaPublicComponent;
  let fixture: ComponentFixture<CategoriaPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
