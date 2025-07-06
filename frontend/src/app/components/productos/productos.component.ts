import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})

export class ProductosComponent implements OnInit {
  busqueda = '';
  productos: any[] = [];
  productosFiltrados: any[] = [];
  mensajeModal = '';
  categoriaSeleccionadaId: string | null = null;
  categoriaSeleccionadaNombre = '';
  productoInactivoNombre = '';
  productoAgregadoNombre = '';
  
  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.categoriaSeleccionadaId = params['categoriaId'] || null;
    const productoDestacadoId = params['idProducto'];

    if (productoDestacadoId) {
      this.productoService.getProductos().subscribe(data => {
        const producto = data.find(p => p._id === productoDestacadoId);

        if (producto) {
          this.productos = [producto];
          this.productosFiltrados = [producto];

          this.categoriaService.getCategorias().subscribe(categorias => {
            const categoria = categorias.find(c =>
              String(c._id) === String(producto.categoriaId?._id || producto.categoriaId)
            );
            this.categoriaSeleccionadaNombre = categoria?.nombre ?? '';
          });
        }
      });

      return;
    }

    // 👇 Si no hay producto específico, se carga todo como siempre
    this.productoService.getProductos().subscribe(data => {
      this.categoriaService.getCategorias().subscribe(categorias => {
        let productosMapeados = data.map(prod => {
          const categoria = categorias.find(c =>
            String(c._id) === String(prod.categoriaId?._id || prod.categoriaId)
          );

          return {
            ...prod,
            categoriaNombre: categoria?.nombre || 'Sin categoría',
            categoriaRealId: categoria?._id || prod.categoriaId?._id || prod.categoriaId
          };
        });

        this.productos = productosMapeados;

        if (this.categoriaSeleccionadaId) {
          const nombreCategoria = categorias.find(c =>
            String(c._id) === this.categoriaSeleccionadaId
          )?.nombre;

          this.categoriaSeleccionadaNombre = nombreCategoria ?? '';
          this.productosFiltrados = this.productos.filter(p =>
            String(p.categoriaRealId) === this.categoriaSeleccionadaId
          );
        } else {
          this.productosFiltrados = [];
        }
      });
    });
  });

  document.addEventListener('hidden.bs.modal', () => {
    const active = document.activeElement as HTMLElement;
    if (active) active.blur();
  });
}


  verTodos(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.categoriaSeleccionadaNombre = '';
    this.productosFiltrados = [];

    // Navega sin query params
    this.router.navigate(['/productos'], {
  queryParams: this.categoriaSeleccionadaId ? { categoriaId: this.categoriaSeleccionadaId } : {}
});
  }

  get cantidadTotal(): number {
  return (this.categoriaSeleccionadaId || this.busqueda)
    ? this.productosFiltrados.length
    : this.productos.length;
}

  volverACategorias(): void {
    this.router.navigate(['/categorias']);
  }

  filtrarProductos(): void {
  const texto = this.busqueda.trim().toLowerCase();

  this.productosFiltrados = this.productos.filter(p => {
    const coincideTexto = p.nombre?.toLowerCase().includes(texto) ||
                          p.descripcion?.toLowerCase().includes(texto) ||
                          p.categoriaNombre?.toLowerCase().includes(texto);

    const coincideCategoria = this.categoriaSeleccionadaId
      ? String(p.categoriaRealId) === this.categoriaSeleccionadaId
      : true;

    return coincideTexto && coincideCategoria;
  });
}


  irAFormulario(): void {
    this.router.navigate(['productos/formulario']);
  }

  editarProducto(producto: any): void {
    this.router.navigate(['productos/editar', producto._id]);
  }

  eliminarProducto(id: string): void {
    if (confirm('¿Estás seguro que querés eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe(() => {
        this.productos = this.productos.filter(p => p._id !== id);
        this.productosFiltrados = this.productosFiltrados.filter(p => p._id !== id);
        this.mostrarModal('Producto eliminado correctamente');
      });
    }
  }

  mostrarModal(mensaje: string): void {
    this.mensajeModal = mensaje;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
  }

  mostrarModalProductoInactivo(nombre: string): void {
    this.productoInactivoNombre = nombre;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalProductoInactivo'));
    modal.show();
  }

agregarAlCarrito(producto: any): void {
    // Lógica provisional: podrías guardar en localStorage o usar un servicio
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  carrito.push(producto);
  localStorage.setItem('carrito', JSON.stringify(carrito));

  this.productoAgregadoNombre = producto.nombre;

  const modal = new (window as any).bootstrap.Modal(document.getElementById('modalCarrito'));
  modal.show();
}
  
}
