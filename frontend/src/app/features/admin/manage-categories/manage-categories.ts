// src/app/features/admin/manage-categories/manage-categories.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CategoriaService } from '../../../data/services/categoria';
import { ICategoria } from '../../../shared/interfaces';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';

@Component({
  selector: 'app-manage-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './manage-categories.html',
  styleUrls: ['./manage-categories.css']
})
export class ManageCategories implements OnInit {
  categorias: ICategoria[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private toastr: ToastrService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.categoriaService.getCategorias().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar las categorías: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe(categorias => {
      this.categorias = categorias;
    });
  }

  editCategory(id: string): void {
    this.router.navigate(['/admin/categories/edit', id]);
  }

  deleteCategory(id: string, nombre: string): void {
    this.confirmDialogService.confirm(`¿Estás seguro de que quieres eliminar la categoría "${nombre}"? Esta acción es irreversible.`)
      .then((confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.categoriaService.deleteCategoria(id).pipe(
            catchError(error => {
              this.errorMessage = error.message || 'Error al eliminar la categoría.';
              this.toastr.error(this.errorMessage ?? 'Error al eliminar la categoría.', 'Error de Eliminación');
              return of(null);
            }),
            finalize(() => this.loading = false)
          ).subscribe(response => {
            if (response) {
              this.successMessage = 'Categoría eliminada exitosamente.';
              this.toastr.success(this.successMessage, 'Eliminación Exitosa');
              this.loadCategorias(); // Recargar la lista de categorías
            }
          });
        }
      });
  }

  toggleCategoryStatus(category: ICategoria): void {
    if (!category._id) {
      this.toastr.error('El ID de la categoría no está definido.', 'Error');
      return;
    }

    this.loading = true;
    const action = category.estado ? 'desactivar' : 'activar';
    let serviceCall;

    if (category.estado) {
      serviceCall = this.categoriaService.desactivarCategoria(category._id);
    } else {
      serviceCall = this.categoriaService.activarCategoria(category._id);
    }

    serviceCall.pipe(
      catchError(error => {
        this.errorMessage = `Error al ${action} la categoría: ` + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, `Error al ${action} Categoría`);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.successMessage = `Categoría ${category.estado ? 'desactivada' : 'activada'} exitosamente.`;
        this.toastr.success(this.successMessage, 'Estado Actualizado');
        category.estado = !category.estado;
      }
    });
  }
}
