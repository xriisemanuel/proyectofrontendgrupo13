// src/app/features/admin/edit-combo/edit-combo.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComboService } from '../../../data/services/combo';
import { ProductoService } from '../../../data/services/producto';
import { ICombo, IProducto } from '../../../shared/interfaces';
import { catchError, finalize, tap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UnplashService } from '../../../data/services/unplash';

// Declara 'cloudinary' como una variable global para TypeScript
declare var cloudinary: any;

@Component({
  selector: 'app-edit-combo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './edit-combo.html',
  styleUrls: ['./edit-combo.css']
})
export class EditComboComponent implements OnInit, OnDestroy {
  comboForm: FormGroup;
  productosDisponibles: IProducto[] = [];
  comboId: string | null = null;
  loading = false;
  loadingProducts = false;
  loadingCombo = true;
  errorMessage: string | null = null;

  // Propiedades para el cálculo de precios
  precioBase: number = 0;
  precioFinal: number = 0;

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

  // Propiedades para la lógica de imagen
  useManualUrl: boolean = false;
  manualImageUrl: string = '';

  // Propiedades para la búsqueda dinámica de productos
  searchProductTerm: string = '';
  filteredProductos: IProducto[] = [];

  private destroy$ = new Subject<void>();

  // Inyección de servicios
  private unplashService = inject(UnplashService);
  private http = inject(HttpClient);

  // Credenciales de Cloudinary
  private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt';
  private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025';

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private productoService: ProductoService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      productosIds: this.fb.array([], Validators.required),
      precioCombo: [null, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.comboId = this.route.snapshot.paramMap.get('id');
    if (this.comboId) {
      this.loadComboDetails(this.comboId);
      this.loadProductos();
    } else {
      this.errorMessage = 'ID de combo no proporcionado para la edición.';
      this.loadingCombo = false;
      this.toastr.error(this.errorMessage, 'Error');
    }

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
   * Carga los detalles del combo existente y rellena el formulario.
   */
  loadComboDetails(id: string): void {
    this.loadingCombo = true;
    this.comboService.getComboById(id).pipe(
      tap(response => {
        const combo = response.combo;
        this.comboForm.patchValue({
          nombre: combo.nombre,
          descripcion: combo.descripcion,
          precioCombo: combo.precioCombo,
          descuento: combo.descuento || 0,
          imagen: combo.imagen,
          activo: combo.activo !== undefined ? combo.activo : true
        });

        // Rellenar el FormArray de productosIds
        this.productosFormArray.clear();
        combo.productosIds.forEach(prodId => {
          this.productosFormArray.push(this.fb.control(prodId));
        });
        this.productosFormArray.markAsPristine();
        this.productosFormArray.markAsUntouched();

        // Calcular precios iniciales
        this.calcularPrecioBase();
        this.calcularPrecioFinal();

        // Inicializar la imagen existente
        if (combo.imagen) {
          this.finalCloudinaryImageUrl = combo.imagen;
          this.manualImageUrl = combo.imagen;
        }
      }),
      catchError(error => {
        this.errorMessage = 'Error al cargar los detalles del combo: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        this.router.navigate(['/admin/combos/manage']);
        return of(null);
      }),
      finalize(() => this.loadingCombo = false)
    ).subscribe();
  }

  /**
   * Carga la lista de productos disponibles.
   */
  loadProductos(): void {
    this.loadingProducts = true;
    this.productoService.getProducts().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error');
        return of([]);
      }),
      finalize(() => this.loadingProducts = false)
    ).subscribe(productos => {
      this.productosDisponibles = productos.filter(p => p.disponible && p.stock > 0);
      this.filteredProductos = this.productosDisponibles;
    });
  }

  /**
   * Getter para acceder fácilmente al FormArray de productosIds.
   */
  get productosFormArray(): FormArray {
    return this.comboForm.get('productosIds') as FormArray;
  }

  /**
   * Maneja el cambio de selección de un producto.
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
   * Verifica si un producto está seleccionado.
   */
  isProductoSelected(productoId: string): boolean {
    return this.productosFormArray.controls.some(control => control.value === productoId);
  }

  /**
   * Calcula el precio base del combo.
   */
  calcularPrecioBase(): void {
    const seleccionados = this.comboForm.get('productosIds')?.value || [];
    this.precioBase = this.productosDisponibles
      .filter(p => seleccionados.includes(p._id))
      .reduce((sum, p) => sum + (p.precio || 0), 0);
    this.comboForm.get('precioCombo')?.setValue(this.precioBase, { emitEvent: false });
  }

  /**
   * Calcula el precio final basado en el descuento.
   */
  calcularPrecioFinal(): void {
    const descuento = this.comboForm.get('descuento')?.value || 0;
    this.precioFinal = this.precioBase * (1 - descuento / 100);
    if (descuento === 100) {
      this.precioFinal = 0;
    }
  }

  // === FUNCIONALIDAD DE BÚSQUEDA DE PRODUCTOS ===
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

  // === FUNCIONALIDAD DE UNSPLASH ===
  searchUnsplashImages(): void {
    this.errorMessage = null;
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
    this.unplashService.buscarImagen(this.unsplashSearchTerm, 9).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isSearchingUnsplash = false;
        if (response && response.results && response.results.length > 0) {
          this.unsplashImages = response.results;
          this.toastr.success(`Se encontraron ${response.results.length} imágenes en Unsplash.`, 'Resultados');
        } else {
          this.unsplashError = 'No se encontraron imágenes para tu búsqueda.';
          this.toastr.warning('No se encontraron imágenes para tu búsqueda.', 'Sin Resultados');
        }
      },
      error: (error) => {
        this.isSearchingUnsplash = false;
        this.unsplashError = 'Error al buscar imágenes en Unsplash: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.unsplashError, 'Error de Búsqueda');
      }
    });
  }

  selectUnsplashImage(unsplashImageUrl: string): void {
    if (this.isProcessingCloudinary) return;
    
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
    
    this.http.post(uploadUrl, formData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.isProcessingCloudinary = false;
        if (response && response.secure_url) {
          this.finalCloudinaryImageUrl = response.secure_url;
          this.comboForm.get('imagen')?.setValue(this.finalCloudinaryImageUrl);
          this.toastr.success('Imagen de Unsplash procesada y guardada en Cloudinary.', 'Procesado Exitoso');
          this.lastProcessedUnsplashUrl = unsplashImageUrl;
          this.selectedUnsplashUrl = null;
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
        this.selectedUnsplashUrl = null;
      }
    });
  }

  // === FUNCIONALIDAD DE URL MANUAL ===
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
    if (this.manualImageUrl && this.manualImageUrl.startsWith('http')) {
      this.comboForm.get('imagen')?.setValue(this.manualImageUrl);
      this.finalCloudinaryImageUrl = this.manualImageUrl;
    } else {
      this.comboForm.get('imagen')?.setValue(null);
      this.finalCloudinaryImageUrl = null;
    }
  }

  /**
   * Maneja el envío del formulario para actualizar el combo.
   */
  onSubmit(): void {
    this.errorMessage = null;
    this.comboForm.markAllAsTouched();

    if (this.comboForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos obligatorios y corrige los errores.', 'Error de Validación');
      console.log('Formulario inválido:', this.comboForm.errors, this.comboForm.value);
      return;
    }

    if (!this.comboForm.get('imagen')?.value) {
      this.toastr.warning('Debes seleccionar una imagen para el combo.', 'Imagen Requerida');
      return;
    }

    this.loading = true;

    // Forzar el precioCombo y descuento actual
    this.comboForm.get('precioCombo')?.setValue(this.precioBase, { emitEvent: false });
    this.comboForm.get('descuento')?.setValue(this.comboForm.get('descuento')?.value || 0, { emitEvent: false });

    // Preparar los datos del combo para enviar al backend
    const comboData = {
      ...this.comboForm.value,
      precioCombo: this.precioBase,
      descuento: this.comboForm.get('descuento')?.value || 0,
      precioFinal: this.precioFinal,
      activo: this.comboForm.get('activo')?.value !== undefined ? this.comboForm.get('activo')?.value : true
    };

    console.log('Datos del combo a actualizar:', comboData);

    if (!this.comboId) {
      this.errorMessage = 'ID de combo no disponible para la actualización.';
      this.toastr.error(this.errorMessage, 'Error');
      this.loading = false;
      return;
    }

    this.comboService.updateCombo(this.comboId, comboData).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al actualizar el combo.';
        this.toastr.error(this.errorMessage ?? 'Error al actualizar el combo.', 'Error de Actualización');
        console.error('Error completo:', error);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success('Combo actualizado exitosamente.', 'Actualización Exitosa');
        
        // Agregar un pequeño delay para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          // Navegar y forzar recarga de combos en manage-combos
          this.router.navigate(['/admin/combos/manage'], { queryParams: { refresh: Date.now() } });
        }, 1500);
      }
    });
  }

  /**
   * Método para obtener los errores de validación de un campo específico.
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
        return `El valor mínimo es ${control.errors['min'].min}.`;
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