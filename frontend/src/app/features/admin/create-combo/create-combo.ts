// src/app/features/admin/create-combo/create-combo.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComboService } from '../../../data/services/combo'; // Ajusta la ruta
import { ProductoService } from '../../../data/services/producto'; // Necesario para obtener productos
import { IProducto } from '../../../shared/interfaces'; // Ajusta la ruta
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr'; // Para mostrar mensajes al usuario

@Component({
  selector: 'app-create-combo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Importa ReactiveFormsModule para trabajar con FormGroup y Validators
    RouterLink // Para el botón de cancelar
  ],
  templateUrl: './create-combo.html',
  styleUrls: ['./create-combo.css']
})
export class CreateComboComponent implements OnInit {
  comboForm: FormGroup;
  productosDisponibles: IProducto[] = [];
  loading = false;
  loadingProducts = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private productoService: ProductoService, // Inyecta ProductoService
    private router: Router,
    private toastr: ToastrService
  ) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      productosIds: this.fb.array([], Validators.required), // Usar FormArray para la selección de productos
      precioCombo: [null, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: ['']
    });
  }

  ngOnInit(): void {
    this.loadProductos(); // Cargar productos al inicializar el componente
  }

  /**
   * Carga la lista de productos disponibles desde el servicio.
   */
  loadProductos(): void {
    this.loadingProducts = true;
    this.productoService.getProducts().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos disponibles: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error');
        return of([]); // Retorna un observable vacío para evitar que la suscripción falle
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
    // Marcar el control como 'touched' para que las validaciones se muestren
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
   * Maneja el envío del formulario.
   */
  onSubmit(): void {
    this.errorMessage = null;
    this.comboForm.markAllAsTouched(); // Marca todos los controles como tocados para mostrar errores

    if (this.comboForm.invalid) {
      this.toastr.error('Por favor, completa todos los campos obligatorios y corrige los errores.', 'Error de Validación');
      console.log('Formulario inválido:', this.comboForm.errors, this.comboForm.value);
      return;
    }

    this.loading = true;
    const comboData = { ...this.comboForm.value };

    this.comboService.createCombo(comboData).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al crear el combo.';
        this.toastr.error(this.errorMessage ?? 'Error al crear el combo.', 'Error de Creación');
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success('Combo creado exitosamente.', 'Creación Exitosa');
        this.router.navigate(['/admin/combos/manage']); // Redirige a la gestión de combos
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
      // Para FormArray de productosIds
      if (field === 'productosIds' && control.errors?.['required'] && this.productosFormArray.controls.length === 0) {
        return 'Debe seleccionar al menos un producto para el combo.';
      }
    }
    return null;
  }
}