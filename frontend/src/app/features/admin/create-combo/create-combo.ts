// src/app/features/admin/create-combo/create-combo.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComboService } from '../../../data/services/combo';
import { ProductoService } from '../../../data/services/producto';
import { IProducto } from '../../../shared/interfaces';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]
import { UnplashService } from '../../../data/services/unplash'; // ¡IMPORTADO!

// ¡IMPORTANTE! Declara 'cloudinary' como una variable global para TypeScript.
// Esto es necesario porque el script del widget de Cloudinary se carga externamente en index.html.
declare var cloudinary: any;

@Component({
    selector: 'app-create-combo',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        FormsModule // Para la búsqueda de Unsplash (ngModel)
    ],
    templateUrl: './create-combo.html',
    styleUrls: ['./create-combo.css']
})
export class CreateComboComponent implements OnInit, OnDestroy {
    comboForm: FormGroup;
    productosDisponibles: IProducto[] = [];
    loading = false;
    loadingProducts = false;
    private destroy$ = new Subject<void>();

    // Propiedades para mostrar mensajes generales en la UI
    errorMessage: string | null = null;
    successMessage: string | null = null;

    // Propiedades para la búsqueda de imágenes en Unsplash
    unsplashSearchTerm: string = '';
    unsplashImages: any[] = [];
    isSearchingUnsplash: boolean = false;
    unsplashError: string | null = null;
    selectedUnsplashUrl: string | null = null;

    // Propiedades para el procesamiento de Cloudinary
    isProcessingCloudinary: boolean = false;
    processingCloudinaryError: string | null = null;
    finalCloudinaryImageUrl: string | null = null; // La URL final de Cloudinary para el campo 'imagen'

    private lastProcessedUnsplashUrl: string | null = null;

    // === NUEVAS PROPIEDADES PARA LA LÓGICA DE IMAGEN ===
    useManualUrl: boolean = false;
    manualImageUrl: string = '';

    // === NUEVAS PROPIEDADES PARA LA BÚSQUEDA DINÁMICA DE PRODUCTOS ===
    searchProductTerm: string = '';
    filteredProductos: IProducto[] = [];

    // === NUEVAS PROPIEDADES PARA EL SLIDER DE DESCUENTO Y PRECIO FINAL ===
    precioBase: number = 0;
    precioFinal: number = 0;

    // Inyección de servicios
    private unplashService = inject(UnplashService); // ¡AHORA INYECTADO!
    private http = inject(HttpClient);

    // Tus credenciales de Cloudinary
    private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt'; // <-- ¡Tu Cloud Name aquí!
    private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025'; // <-- ¡NUEVO PRESET para COMBOS, asegúrate de crearlo!

    constructor(
        private fb: FormBuilder,
        private comboService: ComboService,
        private productoService: ProductoService,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.comboForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            descripcion: ['', Validators.maxLength(500)],
            productosIds: this.fb.array([], [Validators.required, Validators.minLength(1)]), // Requiere al menos 1 producto
            precioCombo: [null, [Validators.required, Validators.min(0)]],
            descuento: [0, [Validators.min(0), Validators.max(100)]],
            imagen: [null, [Validators.required]] // Ahora es requerido, se llenará con la URL de Cloudinary
        });
    }

    ngOnInit(): void {
        this.loadProductos();
        // Inicializar productos filtrados
        this.filteredProductos = this.productosDisponibles;
        // Escuchar cambios en productos seleccionados para recalcular precio
        this.comboForm.get('productosIds')?.valueChanges.subscribe(() => {
            this.calcularPrecioBase();
            this.calcularPrecioFinal();
        });
        // Escuchar cambios en descuento para recalcular precio final
        this.comboForm.get('descuento')?.valueChanges.subscribe(() => {
            this.calcularPrecioFinal();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Carga la lista de productos disponibles desde el servicio.
     */
    loadProductos(): void {
        this.loadingProducts = true;
        this.productoService.getProducts().pipe(
            takeUntil(this.destroy$),
            catchError(error => {
                const msg = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
                this.errorMessage = msg;
                this.toastr.error(msg, 'Error');
                return of([]);
            }),
            finalize(() => this.loadingProducts = false)
        ).subscribe(productos => {
            this.productosDisponibles = productos.filter(p => p.disponible && p.stock > 0);
        });
    }

    /**
     * Getter para acceder fácilmente al FormArray de productosIds en el template.
     */
    get productosFormArray(): FormArray {
        return this.comboForm.get('productosIds') as FormArray;
    }

    /**
     * Maneja el cambio de selección de un producto (checkbox).
     * Añade o remueve el ID del producto del FormArray.
     * @param event El evento de cambio del checkbox.
     * @param productoId El ID del producto.
     */
    onCheckboxChange(event: Event, productoId: string): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        if (isChecked) {
            this.productosFormArray.push(this.fb.control(productoId));
        } else {
            const index = this.productosFormArray.controls.findIndex(x => x.value === productoId);
            if (index >= 0) {
                this.productosFormArray.removeAt(index);
            }
        }
        this.productosFormArray.markAsTouched();
        this.productosFormArray.updateValueAndValidity();
    }

    /**
     * Verifica si un producto está seleccionado en el formulario.
     * @param productoId El ID del producto a verificar.
     * @returns true si el producto está seleccionado, false en caso contrario.
     */
    isProductoSelected(productoId: string): boolean {
        return this.productosFormArray.controls.some(control => control.value === productoId);
    }

    // --- Lógica para buscar imagen en Unsplash ---
    searchUnsplashImages(): void {
        this.errorMessage = null;
        this.successMessage = null;
        this.unsplashError = null;
        this.unsplashImages = [];
        this.selectedUnsplashUrl = null;
        this.finalCloudinaryImageUrl = null;
        this.comboForm.get('imagen')?.setValue(null);
        this.lastProcessedUnsplashUrl = null;

        if (!this.unsplashSearchTerm.trim()) {
            this.toastr.warning('Por favor, ingresa un término de búsqueda para Unsplash.', 'Advertencia');
            return;
        }

        this.isSearchingUnsplash = true;
        this.unplashService.buscarImagen(this.unsplashSearchTerm, 9).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.isSearchingUnsplash = false;
                if (response && response.results && response.results.length > 0) {
                    this.unsplashImages = response.results;
                    this.toastr.success(`Se encontraron ${response.results.length} imágenes en Unsplash.`, 'Resultados');
                } else {
                    this.unsplashImages = [];
                    this.toastr.info('No se encontraron imágenes.', 'Sin Resultados');
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
        if (this.isProcessingCloudinary) return; // Prevenir doble click mientras sube
        this.selectedUnsplashUrl = unsplashImageUrl;
        this.processingCloudinaryError = null;
        this.finalCloudinaryImageUrl = null;
        this.comboForm.get('imagen')?.setValue(null);
        this.isProcessingCloudinary = true;
        if (typeof cloudinary === 'undefined') {
            this.processingCloudinaryError = 'El script de Cloudinary no se ha cargado correctamente.';
            this.isProcessingCloudinary = false;
            this.toastr.error(this.processingCloudinaryError, 'Error de Carga');
            return;
        }
        const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append('file', unsplashImageUrl);
        formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'subte_combos');
        formData.append('public_id', `combo_${Date.now()}`);
        this.http.post(uploadUrl, formData).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
                this.isProcessingCloudinary = false;
                if (response && response.secure_url) {
                    this.finalCloudinaryImageUrl = response.secure_url;
                    this.comboForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
                    this.toastr.success('Imagen de Unsplash guardada en Cloudinary.', 'Procesado Exitoso');
                    this.lastProcessedUnsplashUrl = unsplashImageUrl;
                } else {
                    this.processingCloudinaryError = 'Cloudinary no devolvió una URL válida.';
                    this.toastr.error(this.processingCloudinaryError, 'Error');
                    this.lastProcessedUnsplashUrl = null;
                }
            },
            error: (err) => {
                this.isProcessingCloudinary = false;
                console.error('Error al procesar imagen con Cloudinary:', err);
                this.processingCloudinaryError = 'Hubo un error al guardar la imagen en Cloudinary.';
                this.toastr.error(this.processingCloudinaryError, 'Error de Cloudinary');
                this.lastProcessedUnsplashUrl = null;
                this.finalCloudinaryImageUrl = null;
                this.comboForm.get('imagen')?.setValue(null);
            }
        });
    }

    // === CAMPO DE BÚSQUEDA DINÁMICA DE PRODUCTOS ===
    onSearchProductTermChange(): void {
        const term = this.searchProductTerm.trim().toLowerCase();
        if (!term) {
            this.filteredProductos = this.productosDisponibles;
        } else {
            this.filteredProductos = this.productosDisponibles.filter(p =>
                p.nombre.toLowerCase().includes(term)
            );
        }
    }

    // === SELECCIÓN DE PRODUCTOS (mantener lógica existente, pero usar filteredProductos en la vista) ===
    // Eliminar la función onProductSelect(productoId: string) porque no se usa y causa error.

    // === PRECIO AUTOCALCULADO ===
    calcularPrecioBase(): void {
        const seleccionados = this.comboForm.get('productosIds')?.value || [];
        this.precioBase = this.productosDisponibles
            .filter(p => seleccionados.includes(p._id))
            .reduce((sum, p) => sum + (p.precio || 0), 0);
        // Actualizar el campo de precioCombo (solo lectura)
        this.comboForm.get('precioCombo')?.setValue(this.precioBase, { emitEvent: false });
    }

    // En calcularPrecioFinal, emitir el cambio de precio final al cambiar el slider
    calcularPrecioFinal(): void {
        const descuento = this.comboForm.get('descuento')?.value || 0;
        this.precioFinal = this.precioBase * (1 - descuento / 100);
        // Forzar el valor en el formulario para que se envíe correctamente
        this.comboForm.get('precioCombo')?.setValue(this.precioBase, { emitEvent: false });
        this.comboForm.get('descuento')?.setValue(descuento, { emitEvent: false });
    }

    // === LÓGICA DE IMAGEN: UNSPLASH, CLOUDINARY Y URL MANUAL ===
    setImageSource(source: 'unsplash' | 'manual'): void {
        this.useManualUrl = source === 'manual';
        if (source === 'manual') {
            this.unsplashImages = [];
            this.selectedUnsplashUrl = null;
            this.unsplashSearchTerm = '';
            this.unsplashError = null;
            this.finalCloudinaryImageUrl = null;
            this.comboForm.get('imagen')?.setValue(null);
        } else {
            this.manualImageUrl = '';
            this.processingCloudinaryError = null;
        }
    }

    onManualImageUrlChange(): void {
        // Validar y asignar la URL manual al formulario
        if (this.manualImageUrl && this.manualImageUrl.startsWith('http')) {
            this.comboForm.get('imagen')?.setValue(this.manualImageUrl);
            this.finalCloudinaryImageUrl = this.manualImageUrl;
        } else {
            this.comboForm.get('imagen')?.setValue(null);
            this.finalCloudinaryImageUrl = null;
        }
    }

    /**
     * Maneja el envío del formulario.
     */
    onSubmit(): void {
        this.loading = true;
        this.errorMessage = null;
        this.successMessage = null;
        this.comboForm.markAllAsTouched();

        if (this.comboForm.invalid) {
            this.toastr.error('Por favor, completa todos los campos obligatorios y corrige los errores.', 'Error de Validación');
            this.loading = false;
            return;
        }
        if (!this.comboForm.get('imagen')?.value) {
            this.toastr.warning('Debes buscar y seleccionar una imagen para el combo.', 'Imagen Requerida');
            this.loading = false;
            return;
        }
        // Forzar el precioCombo y descuento actual
        this.comboForm.get('precioCombo')?.setValue(this.precioBase, { emitEvent: false });
        this.comboForm.get('descuento')?.setValue(this.comboForm.get('descuento')?.value || 0, { emitEvent: false });
        // Enviar el formulario
        const comboData = { ...this.comboForm.value, precioFinal: this.precioFinal };
        this.comboService.createCombo(comboData).pipe(
            takeUntil(this.destroy$),
            catchError(error => {
                const apiErrorMessage = error.error?.mensaje || error.message || 'Error al crear el combo.';
                this.errorMessage = apiErrorMessage;
                this.toastr.error(apiErrorMessage, 'Error de Creación');
                return of(null);
            }),
            finalize(() => this.loading = false)
        ).subscribe(response => {
            if (response) {
                this.successMessage = response.mensaje || 'Combo creado exitosamente.';
                this.toastr.success('Creación Exitosa');
                this.comboForm.reset();
                this.productosFormArray.clear();
                this.unsplashSearchTerm = '';
                this.unsplashImages = [];
                this.selectedUnsplashUrl = null;
                this.finalCloudinaryImageUrl = null;
                this.lastProcessedUnsplashUrl = null;
                this.comboForm.get('imagen')?.setValue(null);
                this.precioBase = 0;
                this.precioFinal = 0;
                setTimeout(() => {
                    // Navegar y forzar recarga de combos en manage-combos
                    this.router.navigate(['/admin/combos/manage'], { queryParams: { refresh: Date.now() } });
                }, 1500);
            }
        });
    }

    /**
     * Método para obtener los errores de validación de un campo específico.
     * @param field El nombre del campo.
     * @returns Mensaje de error si existe, de lo contrario, null.
     */
    getFieldError(field: string): string | null {
        const control = this.comboForm.get(field);
        if (control && control.invalid && (control.touched || control.dirty)) {
            if (control.errors?.['required']) {
                return 'Este campo es obligatorio.';
            }
            if (control.errors?.['minlength']) {
                return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
            }
            if (control.errors?.['maxlength']) {
                return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
            }
            if (control.errors?.['min']) {
                const minValue = control.errors['min'].min;
                return `El valor mínimo es ${minValue}.`;
            }
            if (control.errors?.['max']) {
                return `El valor máximo es ${control.errors['max'].max}.`;
            }
            if (field === 'productosIds' && control.errors?.['required'] && this.productosFormArray.controls.length === 0) {
                return 'Debe seleccionar al menos un producto para el combo.';
            }
        }
        return null;
    }
}