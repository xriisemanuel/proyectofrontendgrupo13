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
  @Input() product: any;
  @Output() productClick = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();

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
    const price = this.product.precio || this.product.precioCombo || this.product.precioFinal || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  getProductImage(): string {
    return this.product.imagen || 'https://via.placeholder.com/300x200/f0f0f0/999999?text=Sin+Imagen';
  }

  getProductName(): string {
    return this.product.nombre || 'Producto';
  }

  getProductDescription(): string {
    return this.product.descripcion || '';
  }

  isProductAvailable(): boolean {
    return this.product.disponible !== false && this.product.activo !== false;
  }

  getCategoryName(): string {
    if (this.product.categoriaId) {
      if (typeof this.product.categoriaId === 'string') {
        return 'Categoría';
      } else if (typeof this.product.categoriaId === 'object') {
        return this.product.categoriaId.nombre || 'Categoría';
      }
    }
    return 'Categoría';
  }

  getStockInfo(): string {
    if (this.product.stock !== undefined) {
      return `Stock: ${this.product.stock}`;
    }
    return '';
  }
}
