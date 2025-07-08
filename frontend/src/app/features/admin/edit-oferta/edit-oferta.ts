// src/app/features/admin/edit-oferta/edit-oferta.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importa ValidatorFn, AbstractControl, ValidationErrors para tipar el validador externo
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfertaService } from '../../../data/services/oferta';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';
import { IProducto, ICategoria } from '../../../shared/interfaces';
import { IOferta } from '../../../shared/oferta.interface';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Validador personalizado para asegurar que al menos un producto o categoría esté seleccionado
// ¡Esta es la "otra manera"! Es una función independiente, no un método de clase.
// Por lo tanto, no necesita 'bind(this)' porque no depende del contexto de 'this' del componente.
const atLeastOneApplicableValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const form = control as FormGroup;
  const productos = form.get('productosAplicables') as FormArray;
  const categorias = form.get('categoriasAplicables') as FormArray;

  // Si los FormArray aún no están inicializados (ej. al inicio de la carga),
  // no se puede validar, así que se devuelve null.
  if (!productos || !categorias) {
    return null;
  }

  if (productos.length === 0 && categorias.length === 0) {
    return { atLeastOneApplicable: true };
  }
  return null;
};


@Component({
  selector: 'app-edit-oferta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './edit-oferta.html',
  styleUrls: ['./edit-oferta.css']
})
export class EditOfertaComponent implements OnInit {
  ofertaForm: FormGroup;
  productosDisponibles: IProducto[] = [];
  categoriasDisponibles: ICategoria[] = [];
  ofertaId: string | null = null;
  loading = false;
  loadingProducts = false;
  loadingCategories = false;
  loadingOferta = true;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {
    console.log('Constructor de EditOfertaComponent iniciado.');
    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      descuento: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      productosAplicables: this.fb.array([]),
      categoriasAplicables: this.fb.array([])
    });

    // APLICANDO EL VALIDADOR DIRECTAMENTE COMO UNA FUNCIÓN INDEPENDIENTE
    // Ya no se necesita 'bind(this)'
    this.ofertaForm.setValidators(atLeastOneApplicableValidator);
    console.log('Formulario de oferta inicializado.');
  }

  ngOnInit(): void {
    console.log('ngOnInit de EditOfertaComponent iniciado.');
    this.ofertaId = this.route.snapshot.paramMap.get('id');
    console.log('ID de oferta de la URL:', this.ofertaId);

    if (this.ofertaId) {
      this.loadAllData(this.ofertaId);
    } else {
      this.errorMessage = 'ID de oferta no proporcionado para la edición.';
      this.loadingOferta = false;
      this.toastr.error(this.errorMessage, 'Error');
      console.error('Error: ID de oferta no encontrado en la URL.');
    }
  }

  /**
   * Carga los productos y categorías disponibles, y luego los detalles de la oferta.
   */
  loadAllData(id: string): void {
    console.log('Iniciando carga de todos los datos (productos, categorías, oferta).');
    this.loadingProducts = true;
    this.loadingCategories = true;

    // Cargar productos
    // Asumiendo que el método es getProducts() en ProductoService
    this.productoService.getProducts().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga de Productos');
        console.error('Error en loadProducts:', error);
        return of([]);
      }),
      finalize(() => {
        this.loadingProducts = false;
        console.log('Carga de productos finalizada. loadingProducts:', this.loadingProducts);
        this.checkAllDataLoaded(id);
      })
    ).subscribe(productos => {
      this.productosDisponibles = productos.filter(p => p.disponible && p.stock > 0);
      console.log('Productos disponibles cargados:', this.productosDisponibles.length);
    });

    // Cargar categorías
    // Asumiendo que el método es getCategorias() en CategoriaService
    this.categoriaService.getCategorias().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar las categorías disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga de Categorías');
        console.error('Error en loadCategories:', error);
        return of([]);
      }),
      finalize(() => {
        this.loadingCategories = false;
        console.log('Carga de categorías finalizada. loadingCategories:', this.loadingCategories);
        this.checkAllDataLoaded(id);
      })
    ).subscribe(categorias => {
      this.categoriasDisponibles = categorias;
      console.log('Categorías disponibles cargadas:', this.categoriasDisponibles.length);
    });
  }

  /**
   * Verifica si ambos (productos y categorías) han terminado de cargar y luego carga la oferta.
   */
  private checkAllDataLoaded(ofertaId: string): void {
    console.log('checkAllDataLoaded: Products loaded:', !this.loadingProducts, 'Categories loaded:', !this.loadingCategories);
    if (!this.loadingProducts && !this.loadingCategories) {
      console.log('Todos los datos auxiliares cargados. Iniciando carga de detalles de oferta.');
      this.loadOfertaDetails(ofertaId);
    }
  }

  /**
   * Carga los detalles de la oferta existente y rellena el formulario.
   * @param id El ID de la oferta a cargar.
   */
  loadOfertaDetails(id: string): void {
    console.log('Iniciando loadOfertaDetails para ID:', id);
    this.loadingOferta = true;
    this.ofertaService.getOfertaById(id).pipe(
      tap(oferta => {
        console.log('Oferta recibida del servicio:', oferta);
        if (oferta) {
          this.ofertaForm.patchValue({
            nombre: oferta.nombre,
            descripcion: oferta.descripcion,
            descuento: oferta.descuento,
            fechaInicio: this.formatDate(new Date(oferta.fechaInicio)),
            fechaFin: this.formatDate(new Date(oferta.fechaFin))
          });

          // Rellenar el FormArray de productosAplicables
          this.productosAplicablesArray.clear();
          oferta.productosAplicables.forEach(prod => {
            this.productosAplicablesArray.push(this.fb.control(typeof prod === 'string' ? prod : prod._id!));
          });
          console.log('Productos aplicables en el formulario:', this.productosAplicablesArray.value);

          // Rellenar el FormArray de categoriasAplicables
          this.categoriasAplicablesArray.clear();
          oferta.categoriasAplicables.forEach(cat => {
            this.categoriasAplicablesArray.push(this.fb.control(typeof cat === 'string' ? cat : cat._id!));
          });
          console.log('Categorías aplicables en el formulario:', this.categoriasAplicablesArray.value);

          this.ofertaForm.markAsPristine();
          this.ofertaForm.markAsUntouched();
        } else {
          this.errorMessage = 'No se encontraron detalles para la oferta con ID: ' + id;
          this.toastr.error(this.errorMessage, 'Error de Carga');
          this.router.navigate(['/admin/ofertas']);
        }
      }),
      catchError(error => {
        this.errorMessage = 'Error al cargar los detalles de la oferta: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga de Oferta');
        console.error('Error en loadOfertaDetails:', error);
        this.router.navigate(['/admin/ofertas']);
        return of(null);
      }),
      finalize(() => {
        this.loadingOferta = false;
        console.log('Carga de oferta finalizada. loadingOferta:', this.loadingOferta);
      })
    ).subscribe();
  }

  /**
   * Formatea una fecha a 'YYYY-MM-DD' para el input type="date'.
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

  get productosAplicablesArray(): FormArray {
    return this.ofertaForm.get('productosAplicables') as FormArray;
  }

  get categoriasAplicablesArray(): FormArray {
    return this.ofertaForm.get('categoriasAplicables') as FormArray;
  }

  /**
   * Maneja el cambio de selección de un producto (checkbox).
   */
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
    this.ofertaForm.updateValueAndValidity();
    this.productosAplicablesArray.markAsTouched();
  }

  /**
   * Maneja el cambio de selección de una categoría (checkbox).
   */
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
    this.ofertaForm.updateValueAndValidity();
    this.categoriasAplicablesArray.markAsTouched();
  }

  /**
   * Verifica si un producto está seleccionado en el formulario.
   */
  isProductoSelected(productoId: string): boolean {
    return this.productosAplicablesArray.controls.some(control => control.value === productoId);
  }

  /**
   * Verifica si una categoría está seleccionada en el formulario.
   */
  isCategoriaSelected(categoriaId: string): boolean {
    return this.categoriasAplicablesArray.controls.some(control => control.value === categoriaId);
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.ofertaForm.markAllAsTouched();

    const fechaInicio = new Date(this.ofertaForm.get('fechaInicio')?.value);
    const fechaFin = new Date(this.ofertaForm.get('fechaFin')?.value);

    if (fechaInicio > fechaFin) {
      this.toastr.error('La fecha de fin no puede ser anterior a la fecha de inicio.', 'Error de Fecha');
      this.ofertaForm.get('fechaFin')?.setErrors({ 'fechaInvalida': true });
      return;
    } else {
      this.ofertaForm.get('fechaFin')?.setErrors(null);
    }

    if (this.ofertaForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos obligatorios y corrige los errores.', 'Error de Validación');
      console.log('Errores del formulario:', this.ofertaForm.errors);
      return;
    }

    this.loading = true;
    const ofertaData = {
      ...this.ofertaForm.value,
      fechaInicio: new Date(this.ofertaForm.value.fechaInicio),
      fechaFin: new Date(this.ofertaForm.value.fechaFin),
    };

    if (!this.ofertaId) {
      this.errorMessage = 'ID de oferta no disponible para la actualización.';
      this.toastr.error(this.errorMessage, 'Error');
      this.loading = false;
      return;
    }

    this.ofertaService.updateOferta(this.ofertaId, ofertaData).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al actualizar la oferta.';
        this.toastr.error(this.errorMessage ?? 'Error al actualizar la oferta.', 'Error de Actualización');
        console.error('Error al actualizar la oferta:', error);
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        console.log('Actualización de oferta finalizada. loading:', this.loading);
      })
    ).subscribe(response => {
      if (response) {
        this.toastr.success('Oferta actualizada exitosamente.', 'Actualización Exitosa');
        this.router.navigate(['/admin/ofertas']);
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
    if (this.ofertaForm.errors?.['atLeastOneApplicable'] &&
        (this.productosAplicablesArray.touched || this.categoriasAplicablesArray.touched)) {
        return 'Debe seleccionar al menos un producto o una categoría para la oferta.';
    }
    return null;
  }
}
