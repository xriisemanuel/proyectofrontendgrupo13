import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICombo } from '../../../../../shared/interfaces';

@Component({
  selector: 'app-combo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combo-card.html',
  styleUrl: './combo-card.css'
})
export class ComboCard {
  @Input() combo: any;
  @Output() comboClick = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();
  @Output() buyNow = new EventEmitter<any>();

  onCardClick(): void {
    this.comboClick.emit(this.combo);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation(); // Evitar que se active el click de la tarjeta
    this.addToCart.emit(this.combo);
  }

  onBuyNow(event: Event): void {
    event.stopPropagation(); // Evitar que se active el click de la tarjeta
    this.buyNow.emit(this.combo);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x200/f0f0f0/999999?text=Sin+Imagen';
  }

  getFormattedPrice(): string {
    let price = 0;
    
    // Para combos, usar precioFinal si existe, sino precioCombo
    if (this.combo.precioFinal !== undefined) {
      price = this.combo.precioFinal;
    } else if (this.combo.precioCombo) {
      price = this.combo.precioCombo;
    }
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  getOriginalPrice(): string {
    if (this.combo.precioCombo && this.combo.descuento && this.combo.descuento > 0) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(this.combo.precioCombo);
    }
    return '';
  }

  getComboImage(): string {
    return this.combo.imagen || 'https://via.placeholder.com/300x200/f0f0f0/999999?text=Sin+Imagen';
  }

  getComboName(): string {
    return this.combo.nombre || 'Combo';
  }

  getComboDescription(): string {
    return this.combo.descripcion || '';
  }

  isComboAvailable(): boolean {
    // Verificar si el combo está activo
    if (this.combo.activo !== undefined) {
      return this.combo.activo !== false;
    }
    return true; // Por defecto disponible
  }

  getDiscountInfo(): string {
    if (this.combo.descuento && this.combo.descuento > 0) {
      return `${this.combo.descuento}% OFF`;
    }
    return '';
  }

  getProductCount(): string {
    if (this.combo.productosIds && Array.isArray(this.combo.productosIds)) {
      const count = this.combo.productosIds.length;
      return count === 1 ? '1 producto' : `${count} productos`;
    }
    return '';
  }

  hasDiscount(): boolean {
    return this.combo.descuento && this.combo.descuento > 0;
  }
} 