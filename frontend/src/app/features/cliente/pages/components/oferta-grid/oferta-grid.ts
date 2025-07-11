import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IOfertaPopulated } from '../../../../../shared/oferta.interface';

@Component({
  selector: 'app-oferta-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oferta-grid.html',
  styleUrl: './oferta-grid.css',
  providers: [DatePipe]
})
export class OfertaGrid implements OnChanges {
  @Input() ofertas: any[] = []; // ahora son productos en oferta
  @Input() loading: boolean = false;
  @Input() errorMessage: string | null = null;
  @Input() emptyMessage: string = 'No se encontraron productos en oferta';
  @Output() ofertaSelected = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();
  @Output() buyNow = new EventEmitter<any>();

  constructor(private datePipe: DatePipe) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ofertas'] && changes['ofertas'].currentValue) {
      // Ahora cada "oferta" es un producto en oferta
      changes['ofertas'].currentValue.forEach((prod: any, index: number) => {
        console.log(`🛒 Producto en oferta ${index + 1}:`, {
          nombre: prod.nombre,
          precioOriginal: prod.precioOriginal,
          precioFinal: prod.precioFinal,
          oferta: prod.oferta?.nombre
        });
      });
    }
  }

  onOfertaClick(producto: any): void {
    this.ofertaSelected.emit(producto);
  }

  onAddToCart(producto: any): void {
    this.addToCart.emit(producto);
  }

  onBuyNow(producto: any): void {
    this.buyNow.emit(producto);
  }

  viewOfertaDetails(productoId: string): void {
    const producto = this.ofertas.find(p => p._id === productoId);
    if (producto) {
      this.ofertaSelected.emit(producto);
    }
  }

  getTipoOfertaText(tipoOferta: string): string {
    return tipoOferta === 'producto' ? 'Producto' : 'Categoría';
  }

  getTipoOfertaIcon(tipoOferta: string): string {
    return tipoOferta === 'producto' ? '🍕' : '📂';
  }

  formatDateForDisplay(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return this.datePipe.transform(date, 'mediumDate') || 'N/A';
  }

  isOfertaVigente(oferta: IOfertaPopulated): boolean {
    const now = new Date();
    const fechaInicio = new Date(oferta.fechaInicio);
    const fechaFin = new Date(oferta.fechaFin);
    return oferta.activa && (fechaInicio <= now) && (fechaFin >= now);
  }
} 