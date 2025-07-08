// src/app/features/admin/manage-products/manage-products.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa los servicios y las interfaces necesarias
import { ProductoService } from '../../../data/services/producto';
import { CategoriaService } from '../../../data/services/categoria'; // Para obtener el nombre de la categoría
import { IProducto, ICategoria } from '../../../shared/interfaces';

@Component({
  selector: 'app-manage-products',
  templateUrl: './manage-products.html',
  styleUrls: ['./manage-products.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Necesario para directivas estructurales y navegación
})
export class ManageProducts implements OnInit, OnDestroy {
  productos: IProducto[] = []; // Lista de productos
  categoriasMap: Map<string, string> = new Map(); // Para mapear categoryId a categoryName
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService, // Inyecta CategoriaService
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadCategoriasMap(); // Cargar el mapa de categorías primero
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el mapa de IDs de categoría a nombres de categoría.
   * Esto es útil para mostrar el nombre de la categoría en la tabla de productos.
   */
  loadCategoriasMap(): void {
    this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: ICategoria[]) => {
        this.categoriasMap.clear();
        data.forEach(categoria => {
          this.categoriasMap.set(categoria._id, categoria.nombre);
        });
        this.loadProducts(); // Una vez que las categorías están cargadas, carga los productos
      },
      error: (err) => {
        console.error('Error al cargar el mapa de categorías:', err);
        this.toastr.error('Error al cargar las categorías para mostrar los productos.', 'Error de Carga');
        this.loadProducts(); // Intenta cargar productos de todos modos, aunque la categoría no se muestre
      }
    });
  }

  /**
   * Carga todos los productos del sistema.
   */
  loadProducts(): void {
    this.isLoading = true;
    this.productoService.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: IProducto[]) => {
        this.productos = data;
        this.isLoading = false;
        console.log('Productos cargados:', this.productos);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de productos.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  /**
   * Obtiene el nombre de la categoría a partir de su ID.
   * @param categoriaId El ID de la categoría.
   * @returns El nombre de la categoría o 'Desconocida' si no se encuentra.
   */
  getCategoryName(categoriaId: string | ICategoria): string {
    if (typeof categoriaId === 'object' && categoriaId && categoriaId.nombre) {
      return categoriaId.nombre; // Si el backend ya pobló la categoría
    }
    if (typeof categoriaId === 'string') {
      return this.categoriasMap.get(categoriaId) || 'Desconocida';
    }
    return 'Desconocida';
  }

  /**
   * Navega a la página de edición de producto.
   * @param productId El ID del producto a editar.
   */
  editProduct(productId: string): void {
    this.toastr.info(`Redirigiendo para editar producto con ID: ${productId}.`);
    this.router.navigate(['/admin/products/edit', productId]); // Asume una ruta de edición
  }

  /**
   * Elimina un producto después de confirmar.
   * @param productId El ID del producto a eliminar.
   * @param productName El nombre del producto para el mensaje de confirmación.
   */
  deleteProduct(productId: string, productName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"? Esta acción es irreversible.`)) {
      this.productoService.deleteProduct(productId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Producto eliminado exitosamente.', '¡Eliminado!');
          this.loadProducts(); // Recargar la lista después de la eliminación
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar producto. Intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Eliminación');
        }
      });
    }
  }

  /**
   * Cambia el estado de un producto (Activar/Desactivar).
   * @param product El producto a modificar.
   */
  toggleProductStatus(product: IProducto): void {
    const action = product.estado ? 'desactivar' : 'activar';
    const confirmMessage = `¿Estás seguro de que quieres ${action} el producto "${product.nombre}"?`;

    if (confirm(confirmMessage)) {
      const observable = product.estado ?
        this.productoService.desactivarProduct(product._id) :
        this.productoService.activarProduct(product._id);

      observable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || `Producto ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente.`, '¡Estado Actualizado!');
          this.loadProducts(); // Recargar la lista para reflejar el cambio
        },
        error: (err) => {
          console.error(`Error al ${action} producto:`, err);
          const errorMessage = err.error?.mensaje || `Error al ${action} el producto. Intente de nuevo.`;
          this.toastr.error(errorMessage, 'Error de Actualización');
        }
      });
    }
  }
}