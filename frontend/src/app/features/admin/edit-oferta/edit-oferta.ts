// src/app/features/admin/edit-oferta/edit-oferta.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { OfertaService } from '../../../data/services/oferta';
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria';
import { IProducto, ICategoria } from '../../../shared/interfaces';
import { IOfertaPopulated } from '../../../shared/oferta.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-oferta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './edit-oferta.html',
  styleUrls: ['./edit-oferta.css']
})
export class EditOfertaComponent implements OnInit {
  ofertaForm: FormGroup;
  ofertaId: string = '';
  ofertaOriginal: IOfertaPopulated | null = null;
  productosDisponibles: IProducto[] = [];
  categoriasDisponibles: ICategoria[] = [];
  loading = false;
  loadingOferta = false;
  loadingProducts = false;
  loadingCategories = false;
  errorMessage: string | null = null;
  selectedTipoOferta: 'producto' | 'categoria' = 'producto';
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      porcentajeDescuento: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      tipoOferta: ['producto', [Validators.required]],
      productosAplicables: this.fb.array([]),
      categoriasAplicables: this.fb.array([])
    });

    this.ofertaForm.setValidators(this.atLeastOneApplicableValidator());
  }

  ngOnInit(): void {
    this.ofertaId = this.route.snapshot.params['id'];
    if (!this.ofertaId) {
      this.toastr.error('ID de oferta no proporcionado.', 'Error');
      this.router.navigate(['/admin/ofertas']);
      return;
    }

    this.loadOferta();
    this.loadProductos();
    this.loadCategorias();
    this.setupFormListeners();
  }

  setupFormListeners(): void {
    this.ofertaForm.get('tipoOferta')?.valueChanges.subscribe(tipo => {
      this.selectedTipoOferta = tipo;
      this.clearApplicableArrays();
      this.updateValidation();
    });
  }

  clearApplicableArrays(): void {
    this.productosAplicablesArray.clear();
    this.categoriasAplicablesArray.clear();
    this.ofertaForm.updateValueAndValidity();
  }

  updateValidation(): void {
    if (this.selectedTipoOferta === 'producto') {
      this.ofertaForm.get('productosAplicables')?.setValidators([Validators.required, Validators.minLength(1)]);
      this.ofertaForm.get('categoriasAplicables')?.clearValidators();
    } else {
      this.ofertaForm.get('categoriasAplicables')?.setValidators([Validators.required, Validators.minLength(1)]);
      this.ofertaForm.get('productosAplicables')?.clearValidators();
    }
    this.ofertaForm.get('productosAplicables')?.updateValueAndValidity();
    this.ofertaForm.get('categoriasAplicables')?.updateValueAndValidity();
  }

  atLeastOneApplicableValidator(): import('@angular/forms').ValidatorFn {
    return (control: import('@angular/forms').AbstractControl): { [key: string]: boolean } | null => {
      const tipoOferta = control.get('tipoOferta')?.value;
      const productos = control.get('productosAplicables') as FormArray;
      const categorias = control.get('categoriasAplicables') as FormArray;

      if (tipoOferta === 'producto' && productos && productos.length === 0) {
        return { productosRequired: true };
      }
      if (tipoOferta === 'categoria' && categorias && categorias.length === 0) {
        return { categoriasRequired: true };
      }
      return null;
    };
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  loadOferta(): void {
    this.loadingOferta = true;
    this.ofertaService.getOfertaById(this.ofertaId).pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar la oferta: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of(null);
      }),
      finalize(() => this.loadingOferta = false)
    ).subscribe(oferta => {
      if (oferta) {
        this.ofertaOriginal = oferta;
        this.populateForm(oferta);
      } else {
        this.router.navigate(['/admin/ofertas']);
      }
    });
  }

  populateForm(oferta: IOfertaPopulated): void {
    this.selectedTipoOferta = oferta.tipoOferta;
    
    // Limpiar arrays antes de poblar
    this.productosAplicablesArray.clear();
    this.categoriasAplicablesArray.clear();

    // Poblar productos aplicables
    if (oferta.productosAplicables && oferta.productosAplicables.length > 0) {
      oferta.productosAplicables.forEach(producto => {
        this.productosAplicablesArray.push(new FormControl(producto._id));
      });
    }

    // Poblar categorías aplicables
    if (oferta.categoriasAplicables && oferta.categoriasAplicables.length > 0) {
      oferta.categoriasAplicables.forEach(categoria => {
        this.categoriasAplicablesArray.push(new FormControl(categoria._id));
      });
    }

    this.ofertaForm.patchValue({
      nombre: oferta.nombre,
      descripcion: oferta.descripcion || '',
      porcentajeDescuento: oferta.porcentajeDescuento,
      fechaInicio: this.formatDate(oferta.fechaInicio),
      fechaFin: this.formatDate(oferta.fechaFin),
      tipoOferta: oferta.tipoOferta
    });

    this.updateValidation();
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
    this.ofertaForm.updateValueAndValidity();
    this.productosAplicablesArray.markAsTouched();
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
    this.ofertaForm.updateValueAndValidity();
    this.categoriasAplicablesArray.markAsTouched();
  }

  isProductoSelected(productoId: string): boolean {
    return this.productosAplicablesArray.controls.some(control => control.value === productoId);
  }

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

    this.ofertaService.updateOferta(this.ofertaId, ofertaData).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al actualizar la oferta.';
        this.toastr.error(this.errorMessage || 'Error al actualizar la oferta.', 'Error de Actualización');
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
    
    // Validaciones específicas para arrays
    if (field === 'productosAplicables' && this.ofertaForm.errors?.['productosRequired'] && this.productosAplicablesArray.touched) {
      return 'Debe seleccionar al menos un producto para la oferta.';
    }
    if (field === 'categoriasAplicables' && this.ofertaForm.errors?.['categoriasRequired'] && this.categoriasAplicablesArray.touched) {
      return 'Debe seleccionar al menos una categoría para la oferta.';
    }
    
    return null;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.ofertaForm.get(field);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // Filtrar productos por búsqueda
  get productosFiltrados(): IProducto[] {
    if (!this.searchTerm.trim()) {
      return this.productosDisponibles;
    }
    const searchLower = this.searchTerm.toLowerCase();
    return this.productosDisponibles.filter(producto =>
      producto.nombre.toLowerCase().includes(searchLower) ||
      producto.descripcion?.toLowerCase().includes(searchLower)
    );
  }
}
