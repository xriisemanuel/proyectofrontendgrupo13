import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICategoria } from '../../../../../shared/interfaces';

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-tabs.html',
  styleUrl: './category-tabs.css'
})
export class CategoryTabs {
  @Input() categories: ICategoria[] = [];
  @Input() loading: boolean = false;
  @Output() categorySelected = new EventEmitter<string>();

  selectedCategoryId: string | null = null;

  ngOnInit(): void {
    // Seleccionar la primera categoría por defecto
    if (this.categories.length > 0 && !this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0]._id || null;
      this.onCategoryClick(this.selectedCategoryId);
    }
  }

  ngOnChanges(): void {
    // Cuando cambian las categorías, seleccionar la primera si no hay ninguna seleccionada
    if (this.categories.length > 0 && !this.selectedCategoryId) {
      this.selectedCategoryId = this.categories[0]._id || null;
      this.onCategoryClick(this.selectedCategoryId);
    }
  }

  onCategoryClick(categoryId: string | null): void {
    if (categoryId && !this.loading) {
      this.selectedCategoryId = categoryId;
      this.categorySelected.emit(categoryId);
    }
  }

  isCategoryActive(categoryId: string | null): boolean {
    return this.selectedCategoryId === categoryId;
  }
}
