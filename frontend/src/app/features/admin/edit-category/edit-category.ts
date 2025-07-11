// src/app/features/admin/edit-category/edit-category.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Importa la interfaz y el servicio
import { ICategoria } from '../../../shared/interfaces';
import { CategoriaService } from '../../../data/services/categoria';
import { UnplashService } from '../../../data/services/unplash';

// Declara 'cloudinary' como una variable global para TypeScript
declare var cloudinary: any;

@Component({
  selector: 'app-edit-category',
  templateUrl: './edit-category.html',
  styleUrls: ['./edit-category.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule]
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
  private unplashService = inject(UnplashService);
  private http = inject(HttpClient);

  // Propiedades para la búsqueda de imágenes en Unsplash
  unsplashSearchTerm: string = '';
  unsplashImages: any[] = [];
  isSearchingUnsplash: boolean = false;
  unsplashError: string | null = null;
  selectedUnsplashUrl: string | null = null;

  // Propiedades para el procesamiento de Cloudinary
  isProcessingCloudinary: boolean = false;
  processingCloudinaryError: string | null = null;
  finalCloudinaryImageUrl: string | null = null;
  private lastProcessedUnsplashUrl: string | null = null;

  // Propiedad para controlar el tipo de entrada de imagen
  useManualUrl: boolean = false;

  // Tus credenciales de Cloudinary
  private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt';
  private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025';

  constructor() {
    this.categoryForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(200)],
      imagen: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?.(png|jpg|jpeg|gif)'), Validators.maxLength(2048)]]
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
          imagen: category.imagen
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

  onImageError(event: any): void {
    // Si la imagen falla al cargar, mostrar placeholder
    event.target.style.display = 'none';
    const container = event.target.parentElement;
    if (container) {
      const placeholder = container.querySelector('.no-image-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }

  // Método para cambiar entre modo Unsplash y URL manual
  setImageSource(source: 'unsplash' | 'manual'): void {
    this.useManualUrl = source === 'manual';
    
    // Si cambiamos a URL manual, limpiar los resultados de Unsplash
    if (source === 'manual') {
      this.unsplashImages = [];
      this.selectedUnsplashUrl = null;
      this.unsplashSearchTerm = '';
      this.unsplashError = null;
    }
    
    // Si cambiamos a Unsplash, limpiar errores de Cloudinary
    if (source === 'unsplash') {
      this.processingCloudinaryError = null;
    }
  }

  // --- Lógica para buscar imagen en Unsplash ---
  searchUnsplashImages(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.unsplashError = null;
    this.unsplashImages = [];
    this.selectedUnsplashUrl = null;
    this.finalCloudinaryImageUrl = null;
    this.lastProcessedUnsplashUrl = null;

    if (!this.unsplashSearchTerm.trim()) {
      this.toastr.warning('Por favor, ingresa un término de búsqueda para Unsplash.', 'Advertencia');
      return;
    }

    this.isSearchingUnsplash = true;

    this.unplashService.buscarImagen(this.unsplashSearchTerm + '&per_page=9').pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isSearchingUnsplash = false;
        if (response && response.results && response.results.length > 0) {
          this.unsplashImages = response.results;
          this.toastr.success(`Se encontraron ${response.results.length} imágenes en Unsplash.`, 'Resultados');
        } else {
          this.unsplashImages = [];
          this.toastr.info('No se encontraron imágenes para el término proporcionado en Unsplash.', 'Sin Resultados');
        }
      },
      error: (err) => {
        this.isSearchingUnsplash = false;
        console.error('Error al buscar en Unsplash:', err);
        this.unsplashError = 'Error al buscar imágenes en Unsplash. Por favor, intenta de nuevo.';
        this.toastr.error(this.unsplashError, 'Error de Búsqueda');
      }
    });
  }

  // --- Lógica para seleccionar una imagen de Unsplash y procesarla con Cloudinary ---
  selectUnsplashImage(unsplashImageUrl: string): void {
    // Marcar la imagen seleccionada visualmente
    this.selectedUnsplashUrl = unsplashImageUrl;

    // Limpiar errores anteriores y estado de carga
    this.processingCloudinaryError = null;

    // Si la imagen de Unsplash seleccionada es la misma que la última vez que se procesó
    // Y ya tenemos una URL de Cloudinary asignada al formulario, entonces no reprocesamos.
    if (this.lastProcessedUnsplashUrl === unsplashImageUrl && this.categoryForm.get('imagen')?.value) {
      this.toastr.info('Esta imagen de Unsplash ya fue seleccionada y procesada por Cloudinary.', 'Información');
      this.finalCloudinaryImageUrl = this.categoryForm.get('imagen')?.value;
      return;
    }

    // Si el usuario selecciona una imagen diferente, entonces limpiamos la URL final y el campo del formulario
    this.finalCloudinaryImageUrl = null;
    this.categoryForm.get('imagen')?.setValue(null);

    this.isProcessingCloudinary = true;

    // Verificar que cloudinary esté disponible
    if (typeof cloudinary === 'undefined') {
      this.processingCloudinaryError = 'El script de Cloudinary no se ha cargado correctamente. Recarga la página.';
      this.isProcessingCloudinary = false;
      this.toastr.error(this.processingCloudinaryError, 'Error de Carga');
      return;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', unsplashImageUrl);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'subte_categorias');
    formData.append('public_id', `categoria_${Date.now()}`);

    this.http.post(uploadUrl, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isProcessingCloudinary = false;
        if (response && response.eager && response.eager.length > 0) {
          this.finalCloudinaryImageUrl = response.eager[0].secure_url;
          this.categoryForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
          this.toastr.success('Imagen de Unsplash procesada y guardada en Cloudinary (formato PNG).', 'Procesado Exitoso');
          this.lastProcessedUnsplashUrl = unsplashImageUrl;
        } else if (response && response.secure_url) {
          this.finalCloudinaryImageUrl = response.secure_url;
          this.categoryForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
          this.toastr.success('Imagen de Unsplash guardada en Cloudinary.', 'Procesado Exitoso');
          this.lastProcessedUnsplashUrl = unsplashImageUrl;
        }
      },
      error: (err) => {
        this.isProcessingCloudinary = false;
        console.error('Error al procesar imagen con Cloudinary:', err);
        this.processingCloudinaryError = 'Hubo un error al guardar la imagen en Cloudinary. Por favor, intenta de nuevo.';
        this.toastr.error(this.processingCloudinaryError, 'Error de Cloudinary');
        this.lastProcessedUnsplashUrl = null;
        this.finalCloudinaryImageUrl = null;
        this.categoryForm.get('imagen')?.setValue(null);
      }
    });
  }
}
