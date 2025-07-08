// src/app/features/admin/manage-categories/manage-categories.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa el servicio y la interfaz necesaria
import { CategoriaService } from '../../../data/services/categoria';
import { ICategoria } from '../../../shared/interfaces';

@Component({
  selector: 'app-manage-categories',
  templateUrl: './manage-categories.html',
  styleUrls: ['./manage-categories.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Necesario para directivas estructurales y navegación
})
export class ManageCategories implements OnInit, OnDestroy {
  categorias: ICategoria[] = []; // Lista de categorías
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private categoriaService: CategoriaService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todas las categorías del sistema.
   */
  loadCategorias(): void {
    this.isLoading = true;
    this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: ICategoria[]) => {
        this.categorias = data;
        this.isLoading = false;
        console.log('Categorías cargadas:', this.categorias);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de categorías.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la página de edición de categoría.
   * @param categoryId El ID de la categoría a editar.
   */
  editCategory(categoryId: string): void {
    this.toastr.info(`Redirigiendo para editar categoría con ID: ${categoryId}.`);
    this.router.navigate(['/admin/categories/edit', categoryId]); // Asume una ruta de edición
  }

  /**
   * Elimina una categoría después de confirmar.
   * @param categoryId El ID de la categoría a eliminar.
   * @param categoryName El nombre de la categoría para el mensaje de confirmación.
   */
  deleteCategory(categoryId: string, categoryName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"? Esta acción es irreversible.`)) {
      this.categoriaService.deleteCategoria(categoryId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Categoría eliminada exitosamente.', '¡Eliminada!');
          this.loadCategorias(); // Recargar la lista después de la eliminación
        },
        error: (err) => {
          console.error('Error al eliminar categoría:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar categoría. Intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Eliminación');
        }
      });
    }
  }

  /**
   * Cambia el estado de una categoría (Activar/Desactivar).
   * @param category La categoría a modificar.
   */
  toggleCategoryStatus(category: ICategoria): void {
    const action = category.estado ? 'desactivar' : 'activar';
    const confirmMessage = `¿Estás seguro de que quieres ${action} la categoría "${category.nombre}"?`;

    if (confirm(confirmMessage)) {
      const observable = category.estado ?
        this.categoriaService.desactivarCategoria(category._id) :
        this.categoriaService.activarCategoria(category._id);

      observable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || `Categoría ${action === 'activar' ? 'activada' : 'desactivada'} exitosamente.`, '¡Estado Actualizado!');
          this.loadCategorias(); // Recargar la lista para reflejar el cambio
        },
        error: (err) => {
          console.error(`Error al ${action} categoría:`, err);
          const errorMessage = err.error?.mensaje || `Error al ${action} la categoría. Intente de nuevo.`;
          this.toastr.error(errorMessage, 'Error de Actualización');
        }
      });
    }
  }
}