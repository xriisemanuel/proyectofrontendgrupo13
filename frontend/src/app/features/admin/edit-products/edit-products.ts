// src/app/features/admin/edit-product/edit-product.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

import { IProducto, ICategoria } from '../../../shared/interfaces';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';
import { UnplashService } from '../../../data/services/unplash';

declare var cloudinary: any;

@Component({
  selector: 'app-edit-products',
  templateUrl: './edit-products.html',
  styleUrls: ['./edit-products.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule]
})
export class EditProducts implements OnInit, OnDestroy {
  productForm: FormGroup;
  categorias: ICategoria[] = [];
  isLoadingCategories = true;
  isSaving = false;
  isLoadingProduct = true;
  private destroy$ = new Subject<void>();

  errorMessage: string | null = null;
  successMessage: string | null = null;

  unsplashSearchTerm = '';
  unsplashImages: any[] = [];
  isSearchingUnsplash = false;
  unsplashError: string | null = null;
  selectedUnsplashUrl: string | null = null;

  isProcessingCloudinary = false;
  processingCloudinaryError: string | null = null;
  finalCloudinaryImageUrl: string | null = null;
  private lastProcessedUnsplashUrl: string | null = null;

  productoId: string = '';

  private unplashService = inject(UnplashService);
  private http = inject(HttpClient);
  private readonly CLOUDINARY_CLOUD_NAME = 'ddwy8vhlt';
  private readonly CLOUDINARY_UPLOAD_PRESET = 'subte_2025';

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      categoriaId: ['', Validators.required],
      stock: [null, [Validators.required, Validators.min(0)]],
      imagenUrl: [null, [Validators.required]],
      estado: [true, Validators.required],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastr.error('ID de producto no válido.', 'Error');
      this.router.navigate(['/admin/products']);
      return;
    }
    this.productoId = id;

    this.loadCategorias();
    this.loadProducto();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoadingCategories = false;
      },
      error: () => {
        this.toastr.error('Error al cargar las categorías.', 'Error');
        this.isLoadingCategories = false;
      }
    });
  }

  loadProducto(): void {
    this.productoService.getProductById(this.productoId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (producto) => {
        this.productForm.patchValue({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoriaId: typeof producto.categoriaId === 'object' && producto.categoriaId !== null
            ? (producto.categoriaId as ICategoria)._id
            : producto.categoriaId,
          stock: producto.stock,
          imagenUrl: producto.imagen ?? null,
          estado: producto.disponible
        });
        this.finalCloudinaryImageUrl = producto.imagen ?? null;
        this.isLoadingProduct = false;
      },
      error: () => {
        this.toastr.error('Error al cargar el producto.', 'Error');
        this.router.navigate(['/admin/products']);
      }
    });
  }

  searchUnsplashImages(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.unsplashError = null;
    this.unsplashImages = [];
    this.selectedUnsplashUrl = null;
    this.finalCloudinaryImageUrl = null;
    this.productForm.get('imagenUrl')?.setValue(null);
    this.lastProcessedUnsplashUrl = null;

    if (!this.unsplashSearchTerm.trim()) {
      this.toastr.warning('Por favor, ingresa un término de búsqueda para Unsplash.', 'Advertencia');
      return;
    }

    this.isSearchingUnsplash = true;

    this.unplashService.buscarImagen(this.unsplashSearchTerm, 3).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isSearchingUnsplash = false;
        if (response?.results?.length > 0) {
          this.unsplashImages = response.results;
          this.toastr.success(`Se encontraron ${response.results.length} imágenes en Unsplash.`, 'Resultados');
        } else {
          this.unsplashImages = [];
          this.toastr.info('No se encontraron imágenes para el término proporcionado.', 'Sin Resultados');
        }
      },
      error: (err) => {
        this.isSearchingUnsplash = false;
        console.error('Error al buscar en Unsplash:', err);
        this.unsplashError = 'Error al buscar imágenes en Unsplash.';
        this.toastr.error(this.unsplashError, 'Error de Búsqueda');
      }
    });
  }

  selectUnsplashImage(unsplashImageUrl: string): void {
    this.selectedUnsplashUrl = unsplashImageUrl;
    this.processingCloudinaryError = null;

    if (this.lastProcessedUnsplashUrl === unsplashImageUrl && this.productForm.get('imagenUrl')?.value) {
      this.toastr.info('Esta imagen ya fue procesada.', 'Información');
      this.finalCloudinaryImageUrl = this.productForm.get('imagenUrl')?.value;
      return;
    }

    this.finalCloudinaryImageUrl = null;
    this.productForm.get('imagenUrl')?.setValue(null);
    this.isProcessingCloudinary = true;

    if (typeof cloudinary === 'undefined') {
      this.processingCloudinaryError = 'El script de Cloudinary no se ha cargado.';
      this.isProcessingCloudinary = false;
      this.toastr.error(this.processingCloudinaryError, 'Error de Carga');
      return;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', unsplashImageUrl);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'subte_productos');
    formData.append('public_id', `producto_${Date.now()}`);

    this.http.post(uploadUrl, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.isProcessingCloudinary = false;
        if (response?.secure_url) {
          this.finalCloudinaryImageUrl = response.secure_url;
          this.productForm.get('imagenUrl')?.setValue(this.finalCloudinaryImageUrl);
          this.toastr.success('Imagen guardada en Cloudinary.', 'Éxito');
          this.lastProcessedUnsplashUrl = unsplashImageUrl;
        } else {
          this.processingCloudinaryError = 'Cloudinary no devolvió una URL válida.';
          this.toastr.error(this.processingCloudinaryError, 'Error');
          this.lastProcessedUnsplashUrl = null;
        }
      },
      error: (err) => {
        this.isProcessingCloudinary = false;
        console.error('Error al subir imagen:', err);
        this.processingCloudinaryError = 'Error al guardar la imagen en Cloudinary.';
        this.toastr.error(this.processingCloudinaryError, 'Error');
        this.lastProcessedUnsplashUrl = null;
        this.finalCloudinaryImageUrl = null;
        this.productForm.get('imagenUrl')?.setValue(null);
      }
    });
  }
  onSubmit(): void {
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.productForm.invalid) {
      this.toastr.warning('Por favor, completa todos los campos requeridos.', 'Validación');
      this.productForm.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    if (!this.productForm.get('imagenUrl')?.value) {
      this.toastr.warning('Debes seleccionar una imagen para el producto.', 'Imagen Requerida');
      this.isSaving = false;
      return;
    }

    const formValue = this.productForm.value;
    const updatedProduct: Partial<IProducto> = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      precio: formValue.precio,
      categoriaId: formValue.categoriaId,
      stock: formValue.stock,
      imagen: formValue.imagenUrl,
      disponible: formValue.estado
    };

    console.log('Actualizando producto:', updatedProduct);

    this.productoService.updateProduct(this.productoId, updatedProduct).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.successMessage = response.mensaje || 'Producto actualizado exitosamente.';
        this.toastr.success(this.successMessage ?? 'Producto actualizado.', 'Éxito');
        this.isSaving = false;
        setTimeout(() => {
          this.router.navigate(['/admin/products']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al actualizar el producto:', err);
        const apiErrorMessage = err.error?.mensaje || 'Error al actualizar el producto.';
        this.errorMessage = apiErrorMessage;
        this.toastr.error(apiErrorMessage, 'Error');
        this.isSaving = false;
      }
    });
  }

  get f() {
    return this.productForm.controls;
  }
}
