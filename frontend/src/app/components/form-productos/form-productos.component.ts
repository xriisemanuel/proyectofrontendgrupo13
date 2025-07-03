import { Component, OnInit } from '@angular/core';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-productos',
  imports: [FormsModule, CommonModule],
  templateUrl: './form-productos.component.html',
  styleUrl: './form-productos.component.css'
})
export class FormProductoComponent implements OnInit{
  producto: any = {
    nombre: '',
    descripcion: '',
    imagen: '',
    precio: null,
    estado: true,
    categoria: ''
  };
  categorias: any[] = [];
  modoEdicion = false;
  productoId = '';
  mensajeModal = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();

    this.productoId = this.route.snapshot.paramMap.get('id') ?? '';
    this.modoEdicion = !!this.productoId;

    if (this.modoEdicion) {
      this.productoService.getProductoPorId(this.productoId).subscribe(data => {
        this.producto = data;
      });
    }
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
    });
  }

  guardar(): void {
    if (this.modoEdicion) {
      this.productoService.actualizarProducto(this.productoId, this.producto).subscribe(() => {
        this.mostrarModal('Producto actualizado correctamente');
        setTimeout(() => this.router.navigate(['/productos']), 2000);
      });
    } else {
      this.productoService.crearProducto(this.producto).subscribe(() => {
        this.mostrarModal('Producto creado correctamente');
        setTimeout(() => this.router.navigate(['/productos']), 2000);
      });
    }
  }

  mostrarModal(mensaje: string): void {
    this.mensajeModal = mensaje;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
  }

}
