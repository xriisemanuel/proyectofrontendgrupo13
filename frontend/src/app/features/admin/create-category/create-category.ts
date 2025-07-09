// src/app/features/admin/create-category/create-category.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Importa la interfaz y el servicio
import { ICategoria } from '../../../shared/interfaces';
import { CategoriaService } from '../../../data/services/categoria';
import { UnplashService } from '../../../data/services/unplash'; // Asegúrate de que la ruta sea correcta si es 'data/services/unplash'

// ¡IMPORTANTE! Declara 'cloudinary' como una variable global para TypeScript.
// Esto es necesario porque el script del widget de Cloudinary se carga externamente en index.html.
declare var cloudinary: any;

@Component({
    selector: 'app-create-category',
    templateUrl: './create-category.html',
    styleUrls: ['./create-category.css'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule]
})
export class CreateCategory implements OnInit, OnDestroy {
    categoryForm: FormGroup;
    isSaving: boolean = false;
    private destroy$ = new Subject<void>();

    successMessage: string | null = null;
    errorMessage: string | null = null;

    // Propiedades para la búsqueda de imágenes en Unsplash
    unsplashSearchTerm: string = '';
    unsplashImages: any[] = [];
    isSearchingUnsplash: boolean = false;
    unsplashError: string | null = null;
    selectedUnsplashUrl: string | null = null; // La URL de Unsplash seleccionada

    // Propiedades para el procesamiento de Cloudinary
    isProcessingCloudinary: boolean = false;
    processingCloudinaryError: string | null = null;
    finalCloudinaryImageUrl: string | null = null; // La URL final de Cloudinary para el campo 'imagen'

    // === CORRECCIÓN AQUÍ: DECLARACIÓN DE lastProcessedUnsplashUrl ===
    private lastProcessedUnsplashUrl: string | null = null;

    // Inyección de servicios
    private unplashService = inject(UnplashService);
    private http = inject(HttpClient);

    // Tus credenciales de Cloudinary
    private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt'; // <-- ¡Tu Cloud Name aquí!
    private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025'; // <-- ¡Tu preset sin firma aquí!

    constructor(
        private fb: FormBuilder,
        private categoriaService: CategoriaService,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.categoryForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            imagen: [null, [Validators.required]],
            estado: [true, Validators.required],
        });
    }

    ngOnInit(): void {
        // No hay lógica compleja de inicialización por ahora
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // --- Lógica para buscar imagen en Unsplash ---
    searchUnsplashImages(): void {
        this.errorMessage = null;
        this.successMessage = null;
        this.unsplashError = null;
        this.unsplashImages = [];
        this.selectedUnsplashUrl = null;
        this.finalCloudinaryImageUrl = null;
        this.categoryForm.get('imagen')?.setValue(null);
        // Limpiar también la última URL procesada al iniciar una nueva búsqueda de Unsplash
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
        // No limpiar finalCloudinaryImageUrl ni el campo 'imagen' *aquí*
        // si la intención es que se mantenga la URL final si ya fue procesada.
        // Si el usuario selecciona una imagen NUEVA, entonces sí se limpiará.

        // Si la imagen de Unsplash seleccionada es la misma que la última vez que se procesó
        // Y ya tenemos una URL de Cloudinary asignada al formulario, entonces no reprocesamos.
        if (this.lastProcessedUnsplashUrl === unsplashImageUrl && this.categoryForm.get('imagen')?.value) {
            this.toastr.info('Esta imagen de Unsplash ya fue seleccionada y procesada por Cloudinary.', 'Información');
            // Asegurarse de que `finalCloudinaryImageUrl` refleje el valor actual del formulario si no lo hace ya
            this.finalCloudinaryImageUrl = this.categoryForm.get('imagen')?.value;
            return;
        }

        // Si el usuario selecciona una imagen diferente, entonces limpiamos la URL final y el campo del formulario
        this.finalCloudinaryImageUrl = null;
        this.categoryForm.get('imagen')?.setValue(null);


        this.isProcessingCloudinary = true;

        // Verificar que cloudinary esté disponible (script cargado en index.html)
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
        //formData.append('eager', 'f_png');

        this.http.post(uploadUrl, formData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                this.isProcessingCloudinary = false;
                if (response && response.eager && response.eager.length > 0) {
                    this.finalCloudinaryImageUrl = response.eager[0].secure_url;
                    this.categoryForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
                    this.toastr.success('Imagen de Unsplash procesada y guardada en Cloudinary (formato PNG).', 'Procesado Exitoso');
                    this.lastProcessedUnsplashUrl = unsplashImageUrl; // Guardar la URL de Unsplash que se acaba de procesar
                } else if (response && response.secure_url) {
                    this.finalCloudinaryImageUrl = response.secure_url;
                    this.categoryForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
                    this.toastr.success('Imagen de Unsplash guardada en Cloudinary.', 'Procesado Exitoso');
                    this.lastProcessedUnsplashUrl = unsplashImageUrl; // Guardar la URL de Unsplash que se acaba de procesar
                }
                // Las siguientes líneas se pueden mantener o quitar dependiendo de tu preferencia
                // sobre si limpiar los resultados de Unsplash después de la selección exitosa.
                // this.unsplashImages = [];
                // this.unsplashSearchTerm = '';
            },
            error: (err) => {
                this.isProcessingCloudinary = false;
                console.error('Error al procesar imagen con Cloudinary:', err);
                this.processingCloudinaryError = 'Hubo un error al guardar la imagen en Cloudinary. Por favor, intenta de nuevo.';
                this.toastr.error(this.processingCloudinaryError, 'Error de Cloudinary');
                // Si hay un error al procesar, es importante resetear lastProcessedUnsplashUrl
                // para permitir que el usuario intente procesar la misma URL de nuevo.
                this.lastProcessedUnsplashUrl = null;
                // Si hubo un error, también limpia la URL final y el control del formulario.
                this.finalCloudinaryImageUrl = null;
                this.categoryForm.get('imagen')?.setValue(null);
            }
        });
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

        if (!this.categoryForm.get('imagen')?.value) {
            this.toastr.warning('Debes buscar y seleccionar una imagen para la categoría.', 'Imagen Requerida');
            this.isSaving = false;
            return;
        }

        const newCategoryData: Partial<ICategoria> = this.categoryForm.value;
        console.log('Intentando crear categoría:', newCategoryData);

        this.categoriaService.createCategoria(newCategoryData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.successMessage = response.mensaje || 'Categoría creada exitosamente.';
                this.toastr.success(this.successMessage || 'Categoría creada exitosamente.', '¡Éxito!');
                this.categoryForm.reset({ estado: true });
                this.finalCloudinaryImageUrl = null;
                this.unsplashImages = [];
                this.unsplashSearchTerm = '';
                this.selectedUnsplashUrl = null;
                this.lastProcessedUnsplashUrl = null; // Resetear también al crear la categoría
                this.isSaving = false;
                setTimeout(() => {
                    this.router.navigate(['/admin/categories']);
                }, 1500);
            },
            error: (err) => {
                console.error('Error al crear la categoría:', err);
                const errorMessage = err.error?.mensaje || 'Error al crear la categoría. Por favor, intente de nuevo.';
                this.errorMessage = errorMessage;
                this.toastr.error(errorMessage, 'Error de Creación');
                this.isSaving = false;
            }
        });
    }

    get f() { return this.categoryForm.controls; }
}