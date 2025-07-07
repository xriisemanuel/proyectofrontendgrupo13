import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Combo } from '../../services/combo.service';
import { Producto } from '../../services/producto.service';

@Component({
  selector: 'app-combo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combo-card.component.html',
  styleUrl: './combo-card.component.css'
})
export class ComboCardComponent {
  @Input() combo!: Combo;
  @Input() productos: Producto[] = [];
  @Input() showActions: boolean = false;
  
  @Output() editClick = new EventEmitter<string>();
  @Output() deleteClick = new EventEmitter<string>();
  @Output() activateClick = new EventEmitter<string>();
  @Output() deactivateClick = new EventEmitter<string>();

  getProductosNombres(): string {
    if (!this.combo.productos || this.combo.productos.length === 0) {
      return 'Sin productos';
    }
    
    const nombres = this.combo.productos.map(productoEnCombo => {
      const producto = this.productos.find(p => p._id === productoEnCombo.productoId);
      const nombre = producto ? producto.nombre : 'Producto no encontrado';
      const unidades = productoEnCombo.unidades > 1 ? ` (${productoEnCombo.unidades})` : '';
      return nombre + unidades;
    });
    
    return nombres.slice(0, 3).join(', ') + (nombres.length > 3 ? '...' : '');
  }

  onEditClick(event: Event): void {
    event.stopPropagation();
    if (this.combo._id) {
      this.editClick.emit(this.combo._id);
    }
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    if (this.combo._id) {
      this.deleteClick.emit(this.combo._id);
    }
  }

  onActivateClick(event: Event): void {
    event.stopPropagation();
    if (this.combo._id) {
      this.activateClick.emit(this.combo._id);
    }
  }

  onDeactivateClick(event: Event): void {
    event.stopPropagation();
    if (this.combo._id) {
      this.deactivateClick.emit(this.combo._id);
    }
  }

  getPrecioConDescuento(): number {
    const precioBase = this.calcularPrecioBase();
    if (this.combo.descuento && this.combo.descuento > 0) {
      return precioBase * (1 - this.combo.descuento / 100);
    }
    return precioBase;
  }

  calcularPrecioBase(): number {
    if (!this.combo.productos || this.combo.productos.length === 0) {
      return 0;
    }

    return this.combo.productos.reduce((total, productoEnCombo) => {
      const producto = this.productos.find(p => p._id === productoEnCombo.productoId);
      if (producto) {
        return total + (producto.precio * productoEnCombo.unidades);
      }
      return total;
    }, 0);
  }

  validarImagen(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }
} 