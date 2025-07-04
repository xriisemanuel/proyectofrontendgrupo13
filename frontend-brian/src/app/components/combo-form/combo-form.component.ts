import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComboService } from '../../services/combo.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-combo-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.css'
})
export class ComboFormComponent implements OnInit {
  comboForm: FormGroup;
  mensaje: string = '';
  productos: Producto[] = [];

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private productoService: ProductoService
  ) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      productosIds: [[], Validators.required],
      precioCombo: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: [''],
      estado: [true]
    });
  }

  ngOnInit() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: () => this.productos = []
    });
  }

  onSubmit() {
    if (this.comboForm.valid) {
      this.comboService.addCombo(this.comboForm.value).subscribe({
        next: () => {
          this.mensaje = 'Combo agregado correctamente';
          this.comboForm.reset({ estado: true, descuento: 0, precioCombo: 0, productosIds: [] });
        },
        error: () => {
          this.mensaje = 'Error al agregar combo';
        }
      });
    }
  }
}
