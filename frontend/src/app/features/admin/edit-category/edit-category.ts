// src/app/features/admin/edit-category/edit-category.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Importa la interfaz y el servicio
import { ICategoria } from '../../../shared/interfaces'; // Asegúrate de que la ruta sea correcta
import { CategoriaService } from '../../../data/services/categoria'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-edit-category',
  templateUrl: './edit-category.html',
  styleUrls: ['./edit-category.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class EditCategoryComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  categoryId: string | null = null;
  isSaving: boolean = false;
  isLoading: boolean = true; // Para controlar la carga inicial de la categoría
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  constructor() {
    this.categoryForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(200)],
      imagen: ['', Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?.(png|jpg|jpeg|gif)')],
      estado: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.loadCategoryDetails(this.categoryId);
    } else {
      this.errorMessage = 'ID de categoría no proporcionado para la edición.';
      this.isLoading = false;
      this.toastr.error(this.errorMessage, 'Error de Carga');
      this.router.navigate(['/admin/categories']); // Redirigir si no hay ID
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategoryDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoriaService.getCategoriaById(id).pipe(
      tap(category => {
        if (category) {
          this.categoryForm.patchValue({
            nombre: category.nombre,
            descripcion: category.descripcion,
            imagen: category.imagen,
            estado: category.estado
          });
          this.categoryForm.markAsPristine(); // Marcar como prístino después de cargar
          this.categoryForm.markAsUntouched();
        } else {
          this.errorMessage = 'No se encontraron detalles para la categoría con ID: ' + id;
          this.toastr.error(this.errorMessage, 'Categoría No Encontrada');
          this.router.navigate(['/admin/categories']);
        }
      }),
      catchError(error => {
        console.error('Error al cargar la categoría:', error);
        this.errorMessage = error.error?.mensaje || 'Error al cargar la categoría. Por favor, intenta de nuevo.';
        this.toastr.error('Error de Carga');
        this.router.navigate(['/admin/categories']);
        return of(null); // Retorna un observable nulo para que la cadena no se rompa
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  onSubmit(): void {
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.categoryForm.invalid) {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.categoryForm.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const updatedCategoryData: Partial<ICategoria> = this.categoryForm.value;
    console.log('Intentando actualizar categoría:', updatedCategoryData);

    if (!this.categoryId) {
      this.errorMessage = 'ID de categoría no disponible para la actualización.';
      this.toastr.error(this.errorMessage, 'Error');
      this.isSaving = false;
      return;
    }

    this.categoriaService.updateCategoria(this.categoryId, updatedCategoryData).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error al actualizar la categoría:', err);
        this.errorMessage = err.error?.mensaje || 'Error al actualizar la categoría. Por favor, intente de nuevo.';
        this.toastr.error('Error de Actualización');
        return of(null);
      }),
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = response.mensaje || 'Categoría actualizada exitosamente.';
        this.toastr.success('¡Éxito!');
        setTimeout(() => {
          this.router.navigate(['/admin/categories']);
        }, 1500);
      }
    });
  }

  get f() { return this.categoryForm.controls; }
}
