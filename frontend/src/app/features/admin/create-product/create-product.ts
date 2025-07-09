// src/app/features/admin/create-product/create-product.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Importa FormsModule para [(ngModel)]

// Importa las interfaces y servicios
import { IProducto, ICategoria } from '../../../shared/interfaces';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';
import { UnplashService } from '../../../data/services/unplash'; // Importa el servicio de Unsplash

// ¡IMPORTANTE! Declara 'cloudinary' como una variable global para TypeScript.
// Esto es necesario porque el script del widget de Cloudinary se carga externamente en index.html.
declare var cloudinary: any;

@Component({
    selector: 'app-create-product',
    templateUrl: './create-product.html',
    styleUrls: ['./create-product.css'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule]
})
export class CreateProduct implements OnInit, OnDestroy {
    productForm: FormGroup;
    categorias: ICategoria[] = [];
    isLoadingCategories: boolean = true;
    isSaving: boolean = false;
    private destroy$ = new Subject<void>();

    // Propiedades para mostrar mensajes generales en la UI
    errorMessage: string | null = null;
    successMessage: string | null = null;

    // Propiedades para la búsqueda de imágenes en Unsplash
    unsplashSearchTerm: string = '';
    unsplashImages: any[] = [];
    isSearchingUnsplash: boolean = false; // Indica si Unsplash está buscando
    unsplashError: string | null = null;
    selectedUnsplashUrl: string | null = null; // La URL de Unsplash seleccionada

    // Propiedades para el procesamiento de Cloudinary
    isProcessingCloudinary: boolean = false; // Indica si Cloudinary está fetch/transformando
    processingCloudinaryError: string | null = null;
    finalCloudinaryImageUrl: string | null = null; // La URL final de Cloudinary para el campo 'imagenUrl'

    // Propiedad para rastrear la última URL de Unsplash procesada por Cloudinary
    private lastProcessedUnsplashUrl: string | null = null;

    // Inyección de servicios
    private unplashService = inject(UnplashService);
    private http = inject(HttpClient); // Inyectamos HttpClient para Cloudinary

    // Tus credenciales de Cloudinary
    // ¡Ojo! Para producción, CLOUDINARY_CLOUD_NAME debería estar en variables de entorno o ser proxyado por tu backend.
    // El UPLOAD_PRESET debe ser 'unsigned' para cargas directas desde el frontend.
    private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt'; // <-- ¡Tu Cloud Name aquí!
    private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025'; // <-- ¡NUEVO PRESET para PRODUCTOS, asegúrate de crearlo!

    constructor(
        private fb: FormBuilder,
        private productoService: ProductoService,
        private categoriaService: CategoriaService,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.productForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
            precio: [null, [Validators.required, Validators.min(0.01)]],
            categoriaId: ['', Validators.required],
            stock: [null, [Validators.required, Validators.min(0)]],
            // La URL de imagen de Cloudinary que se guardará en el backend
            imagenUrl: [null, [Validators.required]], // Ahora requerido y será la URL final de Cloudinary
            estado: [true, Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadCategorias();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadCategorias(): void {
        this.isLoadingCategories = true;
        this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
            next: (data: ICategoria[]) => {
                this.categorias = data;
                this.isLoadingCategories = false;
                if (this.categorias.length > 0) {
                    this.productForm.get('categoriaId')?.setValue(this.categorias[0]?._id);
                }
            },
            error: (err) => {
                console.error('Error al cargar categorías:', err);
                this.toastr.error('Error al cargar las categorías disponibles.', 'Error de Carga');
                this.isLoadingCategories = false;
            }
        });
    }

    // --- Lógica para buscar imagen en Unsplash ---
    searchUnsplashImages(): void {
        // Limpiar mensajes de estado
        this.errorMessage = null;
        this.successMessage = null;
        this.unsplashError = null;
        this.unsplashImages = [];
        this.selectedUnsplashUrl = null;
        this.finalCloudinaryImageUrl = null;
        this.productForm.get('imagenUrl')?.setValue(null);
        this.lastProcessedUnsplashUrl = null; // Limpiar también la última URL procesada al iniciar una nueva búsqueda

        if (!this.unsplashSearchTerm.trim()) {
            this.toastr.warning('Por favor, ingresa un término de búsqueda para Unsplash.', 'Advertencia');
            return;
        }

        this.isSearchingUnsplash = true;

        // Llama al servicio de Unsplash. Asegúrate de que tu servicio acepte `perPage` como parámetro.
        // Si no lo modificaste, solo devolverá 1 resultado.
        this.unplashService.buscarImagen(this.unsplashSearchTerm, 9).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.selectedUnsplashUrl = unsplashImageUrl;
        this.processingCloudinaryError = null;

        // Si la imagen de Unsplash seleccionada es la misma que la última vez que se procesó
        // Y ya tenemos una URL de Cloudinary asignada al formulario, entonces no reprocesamos.
        if (this.lastProcessedUnsplashUrl === unsplashImageUrl && this.productForm.get('imagenUrl')?.value) {
            this.toastr.info('Esta imagen de Unsplash ya fue seleccionada y procesada por Cloudinary.', 'Información');
            this.finalCloudinaryImageUrl = this.productForm.get('imagenUrl')?.value;
            return;
        }

        // Si el usuario selecciona una imagen diferente, entonces limpiamos la URL final y el campo del formulario
        this.finalCloudinaryImageUrl = null;
        this.productForm.get('imagenUrl')?.setValue(null);

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
        formData.append('file', unsplashImageUrl); // La URL de Unsplash es el "file" a subir
        formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'subte_productos'); // Carpeta para organizar en Cloudinary (diferente a categorías)
        formData.append('public_id', `producto_${Date.now()}`); // Un ID público único para la imagen

        // NO AÑADIR eager aquí para uploads unsigned.
        // Si quieres forzar a PNG, configúralo en el preset de carga de Cloudinary.

        this.http.post(uploadUrl, formData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                this.isProcessingCloudinary = false;
                if (response && response.secure_url) {
                    this.finalCloudinaryImageUrl = response.secure_url;
                    this.productForm.get('imagenUrl')?.setValue(this.finalCloudinaryImageUrl);
                    this.toastr.success('Imagen de Unsplash guardada en Cloudinary.', 'Procesado Exitoso');
                    this.lastProcessedUnsplashUrl = unsplashImageUrl; // Guardar la URL de Unsplash que se acaba de procesar
                } else {
                    this.processingCloudinaryError = 'Cloudinary no devolvió una URL válida.';
                    this.toastr.error(this.processingCloudinaryError, 'Error');
                    this.lastProcessedUnsplashUrl = null;
                }
                // Opcional: Limpiar resultados de Unsplash después de la selección exitosa
                // this.unsplashImages = [];
                // this.unsplashSearchTerm = '';
                // this.selectedUnsplashUrl = null;
            },
            error: (err) => {
                this.isProcessingCloudinary = false;
                console.error('Error al procesar imagen con Cloudinary:', err);
                this.processingCloudinaryError = 'Hubo un error al guardar la imagen en Cloudinary. Por favor, intenta de nuevo.';
                this.toastr.error(this.processingCloudinaryError, 'Error de Cloudinary');
                this.lastProcessedUnsplashUrl = null;
                this.finalCloudinaryImageUrl = null;
                this.productForm.get('imagenUrl')?.setValue(null);
            }
        });
    }

    onSubmit(): void {
        this.isSaving = true;
        // Limpiar mensajes de estado al intentar guardar
        this.errorMessage = null;
        this.successMessage = null;

        if (this.productForm.invalid) {
            this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
            this.productForm.markAllAsTouched();
            this.isSaving = false;
            return;
        }

        // Asegúrate de que haya una URL de imagen final antes de enviar
        if (!this.productForm.get('imagenUrl')?.value) {
            this.toastr.warning('Debes buscar y seleccionar una imagen para el producto.', 'Imagen Requerida');
            this.isSaving = false;
            return;
        }

        const newProductData: Partial<IProducto> = this.productForm.value;
        console.log('Intentando crear producto:', newProductData);

        this.productoService.createProduct(newProductData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.successMessage = response.mensaje || 'Producto creado exitosamente.'; // Asigna el mensaje de éxito
                this.toastr.success('¡Éxito!'); // Usa el mismo mensaje para Toastr
                this.productForm.reset({ estado: true }); // Reinicia el formulario, manteniendo 'estado' en true
                this.finalCloudinaryImageUrl = null;
                this.unsplashImages = [];
                this.unsplashSearchTerm = '';
                this.selectedUnsplashUrl = null;
                this.lastProcessedUnsplashUrl = null; // Resetear también al crear el producto
                // Opcional: Volver a seleccionar la primera categoría si se resetea
                if (this.categorias.length > 0) {
                    this.productForm.get('categoriaId')?.setValue(this.categorias[0]?._id);
                }
                this.isSaving = false;
                setTimeout(() => {
                    this.router.navigate(['/admin/products']);
                }, 1500);
            },
            error: (err) => {
                console.error('Error al crear el producto:', err);
                const apiErrorMessage = err.error?.mensaje || 'Error al crear el producto. Por favor, intente de nuevo.';
                this.errorMessage = apiErrorMessage; // Asigna el mensaje de error
                this.toastr.error(apiErrorMessage, 'Error de Creación'); // Usa el mismo mensaje para Toastr
                this.isSaving = false;
            }
        });
    }

    // Getter para acceder fácilmente a los controles del formulario en la plantilla
    get f() { return this.productForm.controls; }
}