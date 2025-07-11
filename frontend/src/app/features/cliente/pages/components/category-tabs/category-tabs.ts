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
  @Input() selectedCategoryId: string | null = null;
  @Output() categorySelected = new EventEmitter<string>();

  isCategoryActive(categoryId: string | undefined | null): boolean {
    return this.selectedCategoryId === categoryId;
  }

  onCategoryClick(categoryId: string | undefined | null): void {
    if (!this.loading && categoryId) {
      this.categorySelected.emit(categoryId);
    }
  }
}
