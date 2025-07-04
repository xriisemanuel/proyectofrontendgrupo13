import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OfertaService } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oferta-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './oferta-form.component.html',
  styleUrl: './oferta-form.component.css'
})
export class OfertaFormComponent implements OnInit {
  ofertaForm: FormGroup;
  mensaje: string = '';
  productos: Producto[] = [];
  categorias: Categoria[] = [];

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService
  ) {
    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      descuento: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      productosAplicables: [[]],
      categoriasAplicables: [[]],
      estado: [true]
    });
  }

  ngOnInit() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: () => this.productos = []
    });
    this.categoriaService.getCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: () => this.categorias = []
    });
  }

  onSubmit() {
    if (this.ofertaForm.valid) {
      this.ofertaService.addOferta(this.ofertaForm.value).subscribe({
        next: () => {
          this.mensaje = 'Oferta agregada correctamente';
          this.ofertaForm.reset({ estado: true, descuento: 0, productosAplicables: [], categoriasAplicables: [] });
        },
        error: () => {
          this.mensaje = 'Error al agregar oferta';
        }
      });
    }
  }
}
