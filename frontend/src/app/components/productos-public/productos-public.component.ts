import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-public.component.html',
  styleUrls: ['./productos-public.component.css']
})
export class ProductosPublicComponent implements OnInit {
  busqueda = '';
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categoriaSeleccionadaId: string | null = null;
  categoriaSeleccionadaNombre = '';
  productoAgregadoNombre = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

 ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    const productoDestacadoId = params['idProducto'];
    this.categoriaSeleccionadaId = params['categoriaId'] || null;

    if (productoDestacadoId) {
      this.productoService.getProductos().subscribe(data => {
        const producto = data.find(p => p._id === productoDestacadoId && p.disponible);

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

      return; // 👈 Detenemos la carga general de productos
    }

    // Si no hay producto específico, cargamos todo lo disponible
    this.productoService.getProductos().subscribe(data => {
      this.categoriaService.getCategorias().subscribe(categorias => {
        const disponibles = data.filter(p => p.disponible);

        const productosMapeados = disponibles.map(prod => {
          const categoria = categorias.find(c =>
            String(c._id) === String(prod.categoriaId?._id || prod.categoriaId)
          );

          return {
            ...prod,
            categoriaNombre: categoria?.nombre || 'Sin categoría',
            categoriaRealId: categoria?._id || prod.categoriaId
          };
        });

        this.productos = productosMapeados;

        if (this.categoriaSeleccionadaId) {
          this.categoriaSeleccionadaNombre =
            categorias.find(c => String(c._id) === this.categoriaSeleccionadaId)?.nombre ?? '';

          this.productosFiltrados = this.productos.filter(p =>
            String(p.categoriaRealId) === this.categoriaSeleccionadaId
          );
        } else {
          this.productosFiltrados = [];
        }
      });
    });
  });
}

  get cantidadTotal(): number {
    return (this.categoriaSeleccionadaId || this.busqueda)
      ? this.productosFiltrados.length
      : this.productos.length;
  }

  volverACategorias(): void {
    this.router.navigate(['/categorias-public']);
  }

  verTodos(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.categoriaSeleccionadaNombre = '';
    this.productosFiltrados = [];
    this.router.navigate(['/productos-public']);
  }

  filtrarProductos(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter(p => {
      const coincideTexto =
        p.nombre?.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto) ||
        p.categoriaNombre?.toLowerCase().includes(texto);

      const coincideCategoria = this.categoriaSeleccionadaId
        ? String(p.categoriaRealId) === this.categoriaSeleccionadaId
        : true;

      return coincideTexto && coincideCategoria;
    });
  }

  agregarAlCarrito(producto: any): void {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    carrito.push(producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));

    this.productoAgregadoNombre = producto.nombre;

    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalCarrito'));
    modal.show();
  }
}
