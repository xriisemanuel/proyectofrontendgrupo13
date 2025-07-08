// src/app/features/admin/create-oferta/create-oferta.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OfertaService } from '../../../data/services/oferta';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';
import { IProducto, ICategoria } from '../../../shared/interfaces';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-oferta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './create-oferta.html',
  styleUrls: ['./create-oferta.css']
})
export class CreateOfertaComponent implements OnInit {
  ofertaForm: FormGroup;
  productosDisponibles: IProducto[] = [];
  categoriasDisponibles: ICategoria[] = [];
  loading = false;
  loadingProducts = false;
  loadingCategories = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      descuento: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      fechaInicio: [this.formatDate(new Date()), Validators.required], // Formato YYYY-MM-DD
      fechaFin: ['', Validators.required],
      productosAplicables: this.fb.array([]),
      categoriasAplicables: this.fb.array([])
    });

    // Validar que al menos un producto o categoría sea seleccionado
    this.ofertaForm.setValidators(this.atLeastOneApplicableValidator());
  }

  ngOnInit(): void {
    this.loadProductos();
    this.loadCategorias();
  }

  // Validador personalizado para asegurar que al menos un producto o categoría esté seleccionado
  atLeastOneApplicableValidator(): import('@angular/forms').ValidatorFn {
    return (control: import('@angular/forms').AbstractControl): { [key: string]: boolean } | null => {
      const productos = control.get('productosAplicables') as FormArray;
      const categorias = control.get('categoriasAplicables') as FormArray;

      if (productos && categorias && productos.length === 0 && categorias.length === 0) {
        return { atLeastOneApplicable: true };
      }
      return null;
    };
  }

  /**
   * Formatea una fecha a 'YYYY-MM-DD' para el input type="date".
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  loadProductos(): void {
    this.loadingProducts = true;
    this.productoService.getProducts().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loadingProducts = false)
    ).subscribe(productos => {
      this.productosDisponibles = productos.filter(p => p.disponible && p.stock > 0);
    });
  }

  loadCategorias(): void {
    this.loadingCategories = true;
    this.categoriaService.getCategorias().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar las categorías disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loadingCategories = false)
    ).subscribe(categorias => {
      this.categoriasDisponibles = categorias;
    });
  }

  get productosAplicablesArray(): FormArray {
    return this.ofertaForm.get('productosAplicables') as FormArray;
  }

  get categoriasAplicablesArray(): FormArray {
    return this.ofertaForm.get('categoriasAplicables') as FormArray;
  }

  onProductoChange(event: Event, productoId: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.productosAplicablesArray.push(new FormControl(productoId));
    } else {
      const index = this.productosAplicablesArray.controls.findIndex(x => x.value === productoId);
      if (index >= 0) {
        this.productosAplicablesArray.removeAt(index);
      }
    }
    this.ofertaForm.updateValueAndValidity(); // Revalida el formulario para el validador de al menos uno
  }

  onCategoriaChange(event: Event, categoriaId: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.categoriasAplicablesArray.push(new FormControl(categoriaId));
    } else {
      const index = this.categoriasAplicablesArray.controls.findIndex(x => x.value === categoriaId);
      if (index >= 0) {
        this.categoriasAplicablesArray.removeAt(index);
      }
    }
    this.ofertaForm.updateValueAndValidity(); // Revalida el formulario para el validador de al menos uno
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.ofertaForm.markAllAsTouched();

    // Revalidar fechas antes de enviar
    const fechaInicio = new Date(this.ofertaForm.get('fechaInicio')?.value);
    const fechaFin = new Date(this.ofertaForm.get('fechaFin')?.value);

    if (fechaInicio > fechaFin) {
      this.toastr.error('La fecha de fin no puede ser anterior a la fecha de inicio.', 'Error de Fecha');
      this.ofertaForm.get('fechaFin')?.setErrors({ 'fechaInvalida': true });
      return;
    } else {
      this.ofertaForm.get('fechaFin')?.setErrors(null); // Limpiar error si ya es válido
    }

    if (this.ofertaForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos obligatorios y corrige los errores.', 'Error de Validación');
      console.log('Errores del formulario:', this.ofertaForm.errors);
      console.log('Estado de controles:', this.ofertaForm.controls);
      return;
    }

    this.loading = true;
    const nuevaOferta = {
      ...this.ofertaForm.value,
      fechaInicio: new Date(this.ofertaForm.value.fechaInicio), // Convertir a Date object
      fechaFin: new Date(this.ofertaForm.value.fechaFin), // Convertir a Date object
      // 'estado' no se envía, ya que el backend lo maneja por defecto como true al crear
    };

    this.ofertaService.createOferta(nuevaOferta).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al crear la oferta.';
        this.toastr.error(this.errorMessage ?? 'Error al crear la oferta.', 'Error de Creación');
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success('Oferta creada exitosamente.', 'Creación Exitosa');
        this.router.navigate(['/admin/ofertas']); // Redirige a la gestión de ofertas
      }
    });
  }

  getFieldError(field: string): string | null {
    const control = this.ofertaForm.get(field);
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
      if (control.errors?.['fechaInvalida']) {
        return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
      }
    }
    // Para el validador a nivel de formulario
    if (field === 'productosYCategorias' && this.ofertaForm.errors?.['atLeastOneApplicable'] &&
        (this.productosAplicablesArray.touched || this.categoriasAplicablesArray.touched)) {
        return 'Debe seleccionar al menos un producto o una categoría para la oferta.';
    }
    return null;
  }
}