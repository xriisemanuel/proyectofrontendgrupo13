import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProducto } from '../../../../../shared/interfaces';
import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-grid.html',
  styleUrl: './product-grid.css'
})
export class ProductGrid {
  @Input() products: any[] = [];
  @Input() loading: boolean = false;
  @Output() productSelected = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();

  onProductClick(product: any): void {
    this.productSelected.emit(product);
  }

  onAddToCart(product: any): void {
    this.addToCart.emit(product);
  }
}
