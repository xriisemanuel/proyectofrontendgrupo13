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
  @Input() ofertas: IOfertaPopulated[] = [];
  @Input() loading: boolean = false;
  @Input() errorMessage: string | null = null;
  @Input() emptyMessage: string = 'No se encontraron ofertas';
  @Output() ofertaSelected = new EventEmitter<IOfertaPopulated>();
  @Output() addToCart = new EventEmitter<IOfertaPopulated>();
  @Output() buyNow = new EventEmitter<IOfertaPopulated>();

  constructor(private datePipe: DatePipe) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ofertas'] && changes['ofertas'].currentValue) {
      console.log('🔍 OfertaGrid - Datos recibidos:', changes['ofertas'].currentValue);
      console.log('📊 Total de ofertas:', changes['ofertas'].currentValue.length);
      
      changes['ofertas'].currentValue.forEach((oferta: IOfertaPopulated, index: number) => {
        console.log(`🏷️ Oferta ${index + 1}:`, {
          nombre: oferta.nombre,
          porcentajeDescuento: oferta.porcentajeDescuento,
          tipoOferta: oferta.tipoOferta,
          fechaInicio: oferta.fechaInicio,
          fechaFin: oferta.fechaFin
        });
      });
    }
  }

  onOfertaClick(oferta: IOfertaPopulated): void {
    this.ofertaSelected.emit(oferta);
  }

  onAddToCart(oferta: IOfertaPopulated): void {
    this.addToCart.emit(oferta);
  }

  onBuyNow(oferta: IOfertaPopulated): void {
    this.buyNow.emit(oferta);
  }

  viewOfertaDetails(ofertaId: string): void {
    // Emitir evento para ver detalles de la oferta
    const oferta = this.ofertas.find(o => o._id === ofertaId);
    if (oferta) {
      this.ofertaSelected.emit(oferta);
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