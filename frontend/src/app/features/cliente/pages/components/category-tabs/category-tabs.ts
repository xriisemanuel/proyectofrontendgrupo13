import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICategoria } from '../../../../../shared/interfaces';

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-tabs.html',
  styleUrl: './category-tabs.css'
})
export class CategoryTabs implements OnInit, OnChanges {
  @Input() categories: ICategoria[] = [];
  @Input() loading: boolean = false;
  @Output() categorySelected = new EventEmitter<string>();

  selectedCategoryId: string | null = null;

  ngOnInit(): void {
    // Seleccionar la primera categoría por defecto
    if (this.categories.length > 0 && !this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0]._id || null;
      if (this.selectedCategoryId) {
        this.onCategoryClick(this.selectedCategoryId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando cambian las categorías, seleccionar la primera si no hay ninguna seleccionada
    if (this.categories.length > 0 && !this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0]._id || null;
      if (this.selectedCategoryId) {
        this.onCategoryClick(this.selectedCategoryId);
      }
    }
  }

  onCategoryClick(categoryId: string | null | undefined): void {
    if (categoryId && !this.loading) {
      this.selectedCategoryId = categoryId;
      this.categorySelected.emit(categoryId);
    }
  }

  isCategoryActive(categoryId: string | null | undefined): boolean {
    return this.selectedCategoryId === categoryId;
  }
}
