// src/app/features/products/products-form/products-form.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Aseguramos RouterLink
import { CommonModule } from '@angular/common';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';

// --- IMPORTACIONES DE SERVICIOS Y MODELOS BASADAS EN TU ESTRUCTURA DE ARCHIVOS Y NOMBRES ESPECÍFICOS ---
import { ProductService } from '../producto';
import { Producto } from '../models/producto.model';
import { CategoriaService } from '../../categories/categoria';
import { ICategoria } from '../../categories/models/categoria.model';
import { OpenaiApiService } from '../../../core/services/openai-api';
// --- FIN DE IMPORTACIONES AJUSTADAS ---


@Component({
  selector: 'app-product-form',
  templateUrl: './producto-form.html', // Nombre de archivo de template actualizado
  styleUrls: ['./producto-form.css'], // Nombre de archivo de estilos actualizado
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink // ¡IMPORTANTE! Aseguramos que RouterLink esté aquí para la funcionalidad del router en el template.
  ]
})
export class ProductForm implements OnInit, OnDestroy {
  public productForm: FormGroup;

  isEditMode: boolean = false;
  productId: string | null = null;
  categories: ICategoria[] = [];
  isLoading: boolean = true;
  isGeneratingImage: boolean = false;
  imagePreviewUrl: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoriaService,
    private imageGenerationService: OpenaiApiService,
    private route: ActivatedRoute,
    // === ¡CORRECCIÓN AQUÍ! HACER 'router' PÚBLICO PARA ACCESO DESDE EL TEMPLATE ===
    public router: Router,
    // =========================================================================
    private toastr: ToastrService
  ) {
    this.productForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0)]],
      categoriaId: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]*$/)]],
      disponible: [true],
      popularidad: [0, Validators.min(0)],
      imagenes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.productId = params.get('id');
        if (this.productId) {
          this.isEditMode = true;
          this.isLoading = true;
          return this.productService.getProductById(this.productId);
        } else {
          this.isEditMode = false;
          this.isLoading = false;
          return of(null);
        }
      })
    ).subscribe({
      next: (product: Producto | null) => {
        if (product) {
          this.productForm.patchValue({
            nombre: product.nombre,
            descripcion: product.descripcion,
            precio: product.precio,
            categoriaId: (product.categoriaId as any)?._id || product.categoriaId,
            stock: product.stock,
            disponible: product.disponible,
            popularidad: product.popularidad
          });
          this.imagesArray.clear();
          product.imagenes?.forEach(url => this.imagesArray.push(this.fb.control(url)));
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar el producto:', err);
        this.toastr.error('Error al cargar el producto para edición.', 'Error');
        this.isLoading = false;
        this.router.navigate(['/admin/products']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get imagesArray(): FormArray {
    return this.productForm.get('imagenes') as FormArray;
  }

  loadCategories(): void {
    this.categoryService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: ICategoria[]) => {
        this.categories = data.filter(cat => cat.estado);
        console.log('Categorías cargadas:', this.categories);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.toastr.error('Error al cargar las categorías. Intente recargar la página.', 'Error');
      }
    });
  }

  generateImage(): void {
    const description = this.productForm.get('descripcion')?.value;
    if (!description || description.trim() === '') {
      this.toastr.warning('Por favor, ingresa una descripción para generar la imagen.', 'Advertencia');
      return;
    }

    this.isGeneratingImage = true;
    this.imageGenerationService.generateImage(description).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response && (response as any).imageUrl) {
          this.imagesArray.push(this.fb.control((response as any).imageUrl));
          this.imagePreviewUrl = (response as any).imageUrl;
          this.toastr.success('Imagen generada y añadida.', 'Éxito');
        } else {
          this.toastr.warning('No se pudo generar la imagen. Intenta de nuevo.', 'Advertencia');
        }
        this.isGeneratingImage = false;
      },
      error: (err) => {
        console.error('Error al generar imagen:', err);
        this.toastr.error('Error al generar imagen. Verifica la descripción o intenta más tarde.', 'Error');
        this.isGeneratingImage = false;
      }
    });
  }

  removeImageUrl(index: number): void {
    this.imagesArray.removeAt(index);
    this.imagePreviewUrl = this.imagesArray.length > 0 ? this.imagesArray.at(this.imagesArray.length - 1).value : null;
    this.toastr.info('Imagen eliminada.', 'Información');
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toastr.error('Por favor, complete todos los campos obligatorios y válidos.', 'Error de Validación');
      return;
    }

    this.isLoading = true;
    const productData: Producto = this.productForm.value;

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, productData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.toastr.success(response.mensaje || 'Producto actualizado exitosamente.', '¡Éxito!');
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          this.toastr.error(err.error?.mensaje || 'Error al actualizar el producto.', 'Error');
          this.isLoading = false;
        }
      });
    } else {
      this.productService.createProduct(productData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.toastr.success(response.mensaje || 'Producto creado exitosamente.', '¡Éxito!');
          this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Error al crear producto:', err);
          this.toastr.error(err.error?.mensaje || 'Error al crear el producto.', 'Error');
          this.isLoading = false;
        }
      });
    }
  }
}