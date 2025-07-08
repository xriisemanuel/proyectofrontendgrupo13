import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Oferta } from '../../services/oferta.service';
import { Producto } from '../../services/producto.service';
import { Categoria } from '../../services/categoria.service';

@Component({
  selector: 'app-oferta-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oferta-card.component.html',
  styleUrl: './oferta-card.component.css'
})
export class OfertaCardComponent {
  @Input() oferta!: Oferta;
  @Input() productos: Producto[] = [];
  @Input() categorias: Categoria[] = [];
  @Input() showActions: boolean = false;
  
  @Output() editClick = new EventEmitter<Oferta>();
  @Output() deleteClick = new EventEmitter<string>();
  @Output() activateClick = new EventEmitter<string>();
  @Output() deactivateClick = new EventEmitter<string>();
  @Output() addToCartClick = new EventEmitter<Oferta>();

  getProductosNombres(): string {
    if (!this.oferta.productosAplicables || this.oferta.productosAplicables.length === 0) {
      return 'Todos los productos';
    }
    
    const nombres = this.oferta.productosAplicables.map(p => {
      const producto = this.productos.find(prod => prod._id === (p._id || p));
      return producto ? producto.nombre : 'Producto no encontrado';
    });
    
    return nombres.slice(0, 3).join(', ') + (nombres.length > 3 ? '...' : '');
  }

  getCategoriasNombres(): string {
    if (!this.oferta.categoriasAplicables || this.oferta.categoriasAplicables.length === 0) {
      return 'Todas las categorías';
    }
    
    const nombres = this.oferta.categoriasAplicables.map(c => {
      const categoria = this.categorias.find(cat => cat._id === (c._id || c));
      return categoria ? categoria.nombre : 'Categoría no encontrada';
    });
    
    return nombres.slice(0, 2).join(', ') + (nombres.length > 2 ? '...' : '');
  }

  getFechaFormateada(fecha: Date | string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isOfertaVigente(): boolean {
    const ahora = new Date();
    const inicio = new Date(this.oferta.fechaInicio);
    const fin = new Date(this.oferta.fechaFin);
    
    return ahora >= inicio && ahora <= fin;
  }

  getTiempoRestante(): string {
    if (!this.oferta.fechaFin || !this.oferta.estado) {
      return 'N/A';
    }
    
    const fechaFin = new Date(this.oferta.fechaFin);
    const fechaActual = new Date();
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    
    if (diferencia <= 0) {
      return 'Expirada';
    }
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
      return `${dias}d ${horas}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos}m`;
    }
  }

  isProximaAExpiracion(): boolean {
    if (!this.oferta.fechaFin || !this.oferta.estado) {
      return false;
    }
    
    const fechaFin = new Date(this.oferta.fechaFin);
    const fechaActual = new Date();
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    const horasRestantes = diferencia / (1000 * 60 * 60);
    
    return horasRestantes > 0 && horasRestantes <= 24;
  }

  isExpirada(): boolean {
    if (!this.oferta.fechaFin) {
      return false;
    }
    
    const fechaFin = new Date(this.oferta.fechaFin);
    const fechaActual = new Date();
    
    return fechaActual > fechaFin;
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

  onEditClick(event: Event): void {
    event.stopPropagation();
    this.editClick.emit(this.oferta);
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    if (this.oferta._id) {
      this.deleteClick.emit(this.oferta._id);
    }
  }

  onActivateClick(event: Event): void {
    event.stopPropagation();
    if (this.oferta._id) {
      this.activateClick.emit(this.oferta._id);
    }
  }

  onDeactivateClick(event: Event): void {
    event.stopPropagation();
    if (this.oferta._id) {
      this.deactivateClick.emit(this.oferta._id);
    }
  }

  onAddToCartClick(event: Event): void {
    event.stopPropagation();
    this.addToCartClick.emit(this.oferta);
  }

  // Devuelve el producto único si la oferta aplica solo a un producto y una categoría
  getProductoUnicoConDescuento(): {precioOriginal: number, precioFinal: number, nombre: string} | null {
    if (
      this.oferta.productosAplicables &&
      this.oferta.productosAplicables.length === 1 &&
      this.oferta.categoriasAplicables &&
      this.oferta.categoriasAplicables.length === 1
    ) {
      const productoId = this.oferta.productosAplicables[0]._id || this.oferta.productosAplicables[0];
      const producto = this.productos.find(p => p._id === productoId);
      if (producto) {
        const precioOriginal = producto.precio;
        const descuento = this.oferta.descuento || 0;
        const precioFinal = +(precioOriginal * (1 - descuento / 100)).toFixed(2);
        return { precioOriginal, precioFinal, nombre: producto.nombre };
      }
    }
    return null;
  }
} 