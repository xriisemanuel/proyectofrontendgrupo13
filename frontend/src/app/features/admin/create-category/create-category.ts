// src/app/features/admin/create-category/create-category.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa la interfaz y el servicio
import { ICategoria } from '../../../shared/interfaces';
import { CategoriaService } from '../../../data/services/categoria';

@Component({
  selector: 'app-create-category',
  templateUrl: './create-category.html',
  styleUrls: ['./create-category.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink] // Necesario para formularios y navegación
})
export class CreateCategory implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  isSaving: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.categoryForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      estado: [true, Validators.required] // Por defecto activo
    });
  }

  ngOnInit(): void {
    // No hay lógica compleja de inicialización por ahora
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    this.isSaving = true;
    if (this.categoryForm.valid) {
      const newCategoryData: Partial<ICategoria> = this.categoryForm.value;
      console.log('Intentando crear categoría:', newCategoryData);

      this.categoriaService.createCategoria(newCategoryData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Categoría creada exitosamente.', '¡Éxito!');
          this.categoryForm.reset({ estado: true }); // Reinicia el formulario, manteniendo 'estado' en true
          this.isSaving = false;
          // Redirigir a la gestión de categorías después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/admin/categories']); // Asume que tendrás una ruta para gestionar categorías
          }, 1500);
        },
        error: (err) => {
          console.error('Error al crear la categoría:', err);
          const errorMessage = err.error?.mensaje || 'Error al crear la categoría. Por favor, intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Creación');
          this.isSaving = false;
        }
      });
    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.categoryForm.markAllAsTouched();
      this.isSaving = false;
    }
  }

  // Getter para acceder fácilmente a los controles del formulario en la plantilla
  get f() { return this.categoryForm.controls; }
}