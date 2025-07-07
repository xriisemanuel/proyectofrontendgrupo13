import { Component, OnInit, OnDestroy } from '@angular/core';
import { Producto } from '../../../data/services/producto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../data/services/categoria';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Asegúrate de que RouterLink esté aquí
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Definir interfaces para Producto y Categoria si no las tienes en un archivo de modelos
interface IProducto {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: { _id: string, nombre: string } | string; // Puede ser populado o solo ID
  imagenes: string[];
  disponible: boolean;
  stock: number;
  popularidad: number;
  categoriaNombre?: string; // Nombre de la categoría populado
  categoriaRealId?: string; // ID real de la categoría
}

interface ICategoria {
  _id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: boolean;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // RouterLink debe estar en imports
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class ProductosComponent implements OnInit, OnDestroy {
  busqueda = '';
  productos: IProducto[] = [];
  productosFiltrados: IProducto[] = [];
  categoriaSeleccionadaId: string | null = null;
  categoriaSeleccionadaNombre = '';

  private destroy$ = new Subject<void>();

  constructor(
    private productoService: Producto,
    private categoriaService: Categoria,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.categoriaSeleccionadaId = this.route.snapshot.queryParamMap.get('categoriaId');
    this.loadProductsAndCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProductsAndCategories(): void {
    this.productoService.getProductos().pipe(takeUntil(this.destroy$)).subscribe(dataProductos => {
      this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe(dataCategorias => {
        this.productos = dataProductos.map(prod => {
          let categoriaIdToMatch: string;
          if (typeof prod.categoriaId === 'object' && prod.categoriaId !== null && '_id' in prod.categoriaId) {
            categoriaIdToMatch = String(prod.categoriaId._id);
          } else {
            categoriaIdToMatch = String(prod.categoriaId);
          }

          const categoria = dataCategorias.find(c => String(c._id) === categoriaIdToMatch);

          let realCategoriaId: string | undefined;
          if (typeof prod.categoriaId === 'object' && prod.categoriaId !== null && '_id' in prod.categoriaId) {
            realCategoriaId = String(prod.categoriaId._id);
          } else if (typeof prod.categoriaId === 'string') {
            realCategoriaId = prod.categoriaId;
          } else {
            realCategoriaId = undefined;
          }

          return {
            ...prod,
            categoriaNombre: categoria?.nombre || 'Sin categoría',
            categoriaRealId: realCategoriaId
          };
        });

        if (this.categoriaSeleccionadaId) {
          const nombreCategoria = dataCategorias.find(c =>
            String(c._id) === this.categoriaSeleccionadaId
          )?.nombre;
          this.categoriaSeleccionadaNombre = nombreCategoria ?? '';
          this.productosFiltrados = this.productos.filter(p =>
            String(p.categoriaRealId) === this.categoriaSeleccionadaId
          );
        } else {
          this.productosFiltrados = [...this.productos];
        }
      });
    });
  }

  verTodos(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.categoriaSeleccionadaNombre = '';
    this.productosFiltrados = [...this.productos];
    this.router.navigate(['/admin/productos/manage']);
  }

  volverACategorias(): void {
    this.router.navigate(['/admin/categorias/manage']);
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
    this.router.navigate(['/admin/productos/create']);
  }

  editarProducto(producto: IProducto): void {
    if (producto.disponible && producto.stock > 0) {
      this.router.navigate(['/admin/productos/edit', producto._id]);
    } else {
      Swal.fire({
        title: 'Producto inactivo',
        html: `El producto <strong>${producto.nombre}</strong> no está disponible actualmente.`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  }

  eliminarProducto(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.eliminarProducto(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            Swal.fire(
              '¡Eliminado!',
              'El producto ha sido eliminado.',
              'success'
            );
            this.loadProductsAndCategories();
          },
          error: (err) => {
            console.error('Error al eliminar producto:', err);
            Swal.fire(
              'Error',
              err.error?.mensaje || 'Hubo un error al eliminar el producto.',
              'error'
            );
          }
        });
      }
    });
  }
}
