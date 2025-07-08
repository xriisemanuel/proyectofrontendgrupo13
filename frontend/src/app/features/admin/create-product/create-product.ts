// src/app/features/admin/create-product/create-product.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa las interfaces y servicios
import { IProducto, ICategoria } from '../../../shared/interfaces';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.html',
  styleUrls: ['./create-product.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink] // Necesario para formularios y navegación
})
export class CreateProduct implements OnInit, OnDestroy {
  productForm: FormGroup;
  categorias: ICategoria[] = [];
  isLoadingCategories: boolean = true;
  isSaving: boolean = false;
  private destroy$ = new Subject<void>();

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
      categoriaId: ['', Validators.required], // ID de la categoría seleccionada
      stock: [null, [Validators.required, Validators.min(0)]],
      imagenUrl: ['', Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?.png')], // Validador de URL de imagen (opcional)
      estado: [true, Validators.required] // Por defecto activo
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
        // Opcional: Seleccionar la primera categoría si hay alguna
        if (this.categorias.length > 0) {
          this.productForm.get('categoriaId')?.setValue(this.categorias[0]._id);
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.toastr.error('Error al cargar las categorías disponibles.', 'Error de Carga');
        this.isLoadingCategories = false;
      }
    });
  }

  onSubmit(): void {
    this.isSaving = true;
    if (this.productForm.valid) {
      const newProductData: Partial<IProducto> = this.productForm.value;
      console.log('Intentando crear producto:', newProductData);

      this.productoService.createProduct(newProductData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Producto creado exitosamente.', '¡Éxito!');
          this.productForm.reset({ estado: true }); // Reinicia el formulario, manteniendo 'estado' en true
          // Opcional: Volver a seleccionar la primera categoría si se resetea
          if (this.categorias.length > 0) {
            this.productForm.get('categoriaId')?.setValue(this.categorias[0]._id);
          }
          this.isSaving = false;
          // Redirigir a la gestión de productos después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/admin/products']); // Asume que tendrás una ruta para gestionar productos
          }, 1500);
        },
        error: (err) => {
          console.error('Error al crear el producto:', err);
          const errorMessage = err.error?.mensaje || 'Error al crear el producto. Por favor, intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Creación');
          this.isSaving = false;
        }
      });
    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.productForm.markAllAsTouched();
      this.isSaving = false;
    }
  }

  // Getter para acceder fácilmente a los controles del formulario en la plantilla
  get f() { return this.productForm.controls; }
}