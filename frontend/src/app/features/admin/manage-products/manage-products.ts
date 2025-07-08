// src/app/features/admin/manage-products/manage-products.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importa Router
import { ProductoService } from '../../../data/services/producto';
import { IProducto } from '../../../shared/interfaces'; // Asegúrate de que la ruta es correcta
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './manage-products.html',
  styleUrls: ['./manage-products.css']
})
export class ManageProducts implements OnInit {
  products: IProducto[] = []; // Renombrado a 'products' para mayor claridad
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private productoService: ProductoService,
    private toastr: ToastrService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router // Inyecta Router
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Carga la lista de todos los productos.
   */
  loadProducts(): void {
    this.loading = true;
    this.errorMessage = null;
    this.productoService.getProducts().pipe( // Asumo que el método es getProductos
      catchError(error => {
        this.errorMessage = 'Error al cargar los productos: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe(productos => {
      this.products = productos;
    });
  }

  /**
   * Navega al componente de edición de producto.
   * @param id El ID del producto a editar.
   */
  editProduct(id: string): void {
    this.router.navigate(['/admin/products/edit', id]); // Asumo esta ruta para edición
  }

  /**
   * Elimina un producto después de la confirmación.
   * @param id El ID del producto a eliminar.
   * @param nombre El nombre del producto para el mensaje de confirmación.
   */
  deleteProduct(id: string, nombre: string): void {
    this.confirmDialogService.confirm(`¿Estás seguro de que quieres eliminar el producto "${nombre}"? Esta acción es irreversible.`)
      .then((confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.productoService.deleteProduct(id).pipe( // Asumo el método deleteProducto
            catchError(error => {
              this.errorMessage = error.message || 'Error al eliminar el producto.';
              this.toastr.error(this.errorMessage ?? 'Error al eliminar el producto.', 'Error de Eliminación');
              return of(null);
            }),
            finalize(() => this.loading = false)
          ).subscribe(response => {
            if (response) {
              this.toastr.success('Producto eliminado exitosamente.', 'Eliminación Exitosa');
              this.loadProducts(); // Recargar la lista de productos
            }
          });
        }
      });
  }

  /**
   * Cambia el estado de disponibilidad (activo/inactivo) de un producto.
   * @param product El producto a actualizar.
   */
  toggleProductStatus(product: IProducto): void {
    // Asegurarse de que el ID del producto no sea undefined
    if (!product._id) {
      this.toastr.error('El ID del producto no está definido.', 'Error');
      return;
    }

    this.loading = true;
    // CORREGIDO: Usar 'disponible' en lugar de 'estado'
    const action = product.disponible ? 'desactivar' : 'activar';
    let serviceCall;

    // CORREGIDO: Usar 'disponible' y product._id!
    if (product.disponible) {
      serviceCall = this.productoService.desactivarProduct(product._id!); // Asumo este método
    } else {
      serviceCall = this.productoService.activarProduct(product._id!); // Asumo este método
    }

    serviceCall.pipe(
      catchError(error => {
        this.errorMessage = `Error al ${action} el producto: ` + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, `Error al ${action} Producto`);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        // CORREGIDO: Usar 'disponible'
        this.toastr.success(`Producto ${product.disponible ? 'desactivado' : 'activado'} exitosamente.`, 'Estado Actualizado');
        // Actualizar el estado en el objeto local para reflejar el cambio sin recargar todo
        product.disponible = !product.disponible;
      }
    });
  }
}