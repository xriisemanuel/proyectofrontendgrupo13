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
    let price = 0;
    
    // Manejar diferentes tipos de productos
    if (this.product.precio) {
      price = this.product.precio;
    } else if (this.product.precioCombo) {
      price = this.product.precioCombo;
    } else if (this.product.precioFinal) {
      price = this.product.precioFinal;
    } else if (this.product.precioOferta) {
      price = this.product.precioOferta;
    }
    
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
    // Manejar diferentes tipos de disponibilidad
    if (this.product.disponible !== undefined) {
      return this.product.disponible !== false;
    }
    if (this.product.activo !== undefined) {
      return this.product.activo !== false;
    }
    if (this.product.estado !== undefined) {
      return this.product.estado !== false;
    }
    return true; // Por defecto disponible
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

  getProductType(): string {
    if (this.product.precioCombo !== undefined) {
      return 'Combo';
    }
    if (this.product.precioOferta !== undefined || this.product.estado !== undefined) {
      return 'Oferta';
    }
    return 'Producto';
  }

  getDiscountInfo(): string {
    if (this.product.descuento && this.product.descuento > 0) {
      return `${this.product.descuento}% OFF`;
    }
    return '';
  }
}
