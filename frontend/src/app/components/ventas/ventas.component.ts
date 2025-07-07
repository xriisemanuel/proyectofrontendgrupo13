import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VentasService, NuevaVenta, Venta } from '../../services/ventas.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent {
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  filtroMetodo: string = '';
  error: string = '';

  private fb = inject(FormBuilder);
  private ventasService = inject(VentasService);

  form = this.fb.group({
    pedidoId: ['', Validators.required],
    clienteId: ['', Validators.required],
    montoTotal: [0, [Validators.required, Validators.min(0)]],
    metodoPago: ['', Validators.required]
  });

  constructor() {
    this.loadVentas();
  }

  loadVentas() {
    this.ventasService.getVentas().subscribe({
      next: (data) => {
        this.ventas = data;
        this.aplicarFiltro();
      },
      error: () => this.error = 'Error al cargar ventas'
    });
  }

  aplicarFiltro() {
    if (!this.filtroMetodo) {
      this.ventasFiltradas = this.ventas;
    } else {
      this.ventasFiltradas = this.ventas.filter(v => v.metodoPago === this.filtroMetodo);
    }
  }

  onFiltroChange() {
    this.aplicarFiltro();
  }

  onSubmit() {
    this.error = '';

    if (this.form.invalid) {
      this.error = 'Formulario inválido: completá todos los campos.';
      return;
    }

    const nuevaVenta: NuevaVenta = {
      pedidoId: this.form.value.pedidoId!,
      clienteId: this.form.value.clienteId!,
      montoTotal: this.form.value.montoTotal!,
      metodoPago: this.form.value.metodoPago!
    };

    this.ventasService.createVenta(nuevaVenta).subscribe({
      next: () => {
        this.form.reset({
          pedidoId: '',
          clienteId: '',
          montoTotal: 0,
          metodoPago: ''
        });
        this.loadVentas();
      },
      error: () => this.error = 'Error al crear venta'
    });
  }
}
