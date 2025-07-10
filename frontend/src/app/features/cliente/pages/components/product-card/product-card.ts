import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProducto } from '../../../../../shared/interfaces';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input() product!: IProducto;
  @Output() productClick = new EventEmitter<IProducto>();
  @Output() addToCart = new EventEmitter<IProducto>();

  onCardClick(): void {
    this.productClick.emit(this.product);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation(); // Evitar que se active el click de la tarjeta
    this.addToCart.emit(this.product);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x200/f0f0f0/999999?text=Sin+Imagen';
  }

  getFormattedPrice(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(this.product.precio);
  }

  getProductImage(): string {
    return this.product.imagen || 'https://via.placeholder.com/300x200/f0f0f0/999999?text=Sin+Imagen';
  }
}
