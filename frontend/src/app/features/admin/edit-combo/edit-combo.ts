// src/app/features/admin/edit-combo/edit-combo.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Importa ActivatedRoute para obtener el ID
import { ComboService } from '../../../data/services/combo'; // Ajusta la ruta
import { ProductoService } from '../../../data/services/producto'; // Necesario para obtener productos
import { ICombo, IProducto } from '../../../shared/interfaces'; // Ajusta la ruta
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-combo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './edit-combo.html',
  styleUrls: ['./edit-combo.css']
})
export class EditComboComponent implements OnInit {
  comboForm: FormGroup;
  productosDisponibles: IProducto[] = [];
  comboId: string | null = null;
  loading = false;
  loadingProducts = false;
  loadingCombo = true;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private productoService: ProductoService,
    private route: ActivatedRoute, // Para obtener el ID del combo de la URL
    private router: Router,
    private toastr: ToastrService
  ) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      productosIds: this.fb.array([], Validators.required),
      precioCombo: [null, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: ['']
    });
  }

  ngOnInit(): void {
    this.comboId = this.route.snapshot.paramMap.get('id'); // Obtiene el ID de la URL
    if (this.comboId) {
      this.loadComboDetails(this.comboId);
      this.loadProductos(); // Cargar productos disponibles
    } else {
      this.errorMessage = 'ID de combo no proporcionado para la edición.';
      this.loadingCombo = false;
      this.toastr.error(this.errorMessage, 'Error');
    }
  }

  /**
   * Carga los detalles del combo existente y rellena el formulario.
   * @param id El ID del combo a cargar.
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
          descuento: combo.descuento,
          imagen: combo.imagen
        });

        // Rellenar el FormArray de productosIds
        this.productosFormArray.clear(); // Limpiar antes de añadir
        combo.productosIds.forEach(prodId => {
          this.productosFormArray.push(this.fb.control(prodId));
        });
        this.productosFormArray.markAsPristine(); // Marcar como no modificado inicialmente
        this.productosFormArray.markAsUntouched(); // Marcar como no tocado inicialmente
      }),
      catchError(error => {
        this.errorMessage = 'Error al cargar los detalles del combo: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        this.router.navigate(['/admin/combos']); // Redirigir si no se puede cargar el combo
        return of(null);
      }),
      finalize(() => this.loadingCombo = false)
    ).subscribe();
  }

  /**
   * Carga la lista de productos disponibles desde el servicio.
   */
  loadProductos(): void {
    this.loadingProducts = true;
    this.productoService.getProducts().pipe( // Asumo que el método es getProductos
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error');
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

    this.loading = true;
    const comboData = { ...this.comboForm.value };

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
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success('Combo actualizado exitosamente.', 'Actualización Exitosa');
        this.router.navigate(['/admin/combos']); // Redirige a la gestión de combos
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