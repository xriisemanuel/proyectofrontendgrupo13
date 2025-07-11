import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICombo } from '../../../../../shared/interfaces';
import { ComboCard } from '../combo-card/combo-card';

@Component({
  selector: 'app-combo-grid',
  standalone: true,
  imports: [CommonModule, ComboCard],
  templateUrl: './combo-grid.html',
  styleUrl: './combo-grid.css'
})
export class ComboGrid {
  @Input() combos: ICombo[] = [];
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'No se encontraron combos';
  @Output() comboSelected = new EventEmitter<any>();
  @Output() addToCart = new EventEmitter<any>();
  @Output() buyNow = new EventEmitter<any>();

  onComboClick(combo: any): void {
    this.comboSelected.emit(combo);
  }

  onAddToCart(combo: any): void {
    this.addToCart.emit(combo);
  }

  onBuyNow(combo: any): void {
    this.buyNow.emit(combo);
  }
} 