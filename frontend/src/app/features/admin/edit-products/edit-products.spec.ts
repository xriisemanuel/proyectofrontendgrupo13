import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProducts } from './edit-products';

describe('EditProducts', () => {
  let component: EditProducts;
  let fixture: ComponentFixture<EditProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
