import { Component, OnInit } from '@angular/core';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-productos.component.html',
  styleUrl: './form-productos.component.css'
})
export class FormProductoComponent implements OnInit {
  producto: any = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagenes: [''],
    popularidad: 0,
    categoriaId: ''
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
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();

    // Si hay ID en la URL, estamos editando
    this.productoId = this.route.snapshot.paramMap.get('id') ?? '';
    this.modoEdicion = !!this.productoId;

    if (this.modoEdicion) {
      this.productoService.getProductoPorId(this.productoId).subscribe(data => {
        this.producto = { ...data };
        if (!this.producto.imagenes || this.producto.imagenes.length === 0) {
          this.producto.imagenes = [''];
        }
      });
    }
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
    });
  }

  guardar(): void {
    const operacion = this.modoEdicion
      ? this.productoService.actualizarProducto(this.productoId, this.producto)
      : this.productoService.crearProducto(this.producto);

    operacion.subscribe(() => {
      const mensaje = this.modoEdicion
        ? 'Producto actualizado correctamente'
        : 'Producto creado correctamente';

      this.mostrarModal(mensaje);
      setTimeout(() => this.router.navigate(['productos']), 2000);
    });
  }

  agregarImagen(): void {
    this.producto.imagenes.push('');
  }

  quitarImagen(index: number): void {
    this.producto.imagenes.splice(index, 1);
  }

mostrarModal(mensaje: string): void {
  this.mensajeModal = mensaje;
  const modalEl = document.getElementById('modalExito');
  const modal = new (window as any).bootstrap.Modal(modalEl);
  modal.show();

  // Cierre automático con fade después de 2 segundos
  setTimeout(() => {
    modal.hide();
  }, 1000);

  // Limpieza del overlay/backdrop
  modalEl?.addEventListener('hidden.bs.modal', () => {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
  });
}
volver(): void {
  const esEdicion = this.route.snapshot.paramMap.get('id');
  this.router.navigate([esEdicion ? '/productos' : '/productos']);
}

}
