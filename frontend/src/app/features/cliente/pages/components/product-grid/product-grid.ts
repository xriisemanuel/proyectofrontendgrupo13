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
  @Input() products: IProducto[] = [];
  @Input() loading: boolean = false;
  @Output() productSelected = new EventEmitter<IProducto>();
  @Output() addToCart = new EventEmitter<IProducto>();

  onProductClick(product: IProducto): void {
    this.productSelected.emit(product);
  }

  onAddToCart(product: IProducto): void {
    this.addToCart.emit(product);
  }
}
