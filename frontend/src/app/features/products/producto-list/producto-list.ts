// src/app/features/products/components/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)] (si usas filtros en el HTML)
import { RouterModule, Router } from '@angular/router'; // Necesario para routerLink y router.navigate (si lo usas)

// Servicios y Modelos de tu aplicación (rutas y nombres exactos según tu indicación)
import { ProductService } from '../../products/producto'; // Usando tu ruta especificada
import { Producto } from '../../products/models/producto.model';
import { ICategoria } from '../../categories/models/categoria.model'; // Para el tipado de categoría
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-producto-list', // Manteniendo el selector
  standalone: true, // ¡Importante: Componente Standalone!
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // Necesario si usas [routerLink] o router.navigate en la plantilla
  ],
  templateUrl: './producto-list.html', // Nombre de archivo exacto según tu indicación
  styleUrls: ['./producto-list.css'] // Nombre de archivo exacto según tu indicación
})
export class ProductoListComponent implements OnInit {
  products: Producto[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  filterStatus: string = 'all'; // Para el filtro de disponibilidad

  constructor(
    private productService: ProductService,
    private router: Router, // Inyectamos Router aquí
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getProducts();
  }

  getProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getProducts().subscribe({
      next: (data: Producto[]) => {
        this.products = data;
        this.isLoading = false;
        if (this.products.length === 0) {
          this.toastr.info('No hay productos registrados.', 'Información');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al obtener productos:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al cargar productos. Por favor, inténtalo de nuevo más tarde.';
        this.toastr.error(this.errorMessage, 'Error');
      }
    });
  }

  editProduct(id: string): void {
    this.router.navigate(['/admin/products/edit', id]); // Uso de router.navigate
  }

  deleteProduct(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toastr.success('Producto eliminado exitosamente.', 'Eliminación');
          this.getProducts(); // Vuelve a cargar la lista
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al eliminar producto:', error);
          const msg = error.error?.mensaje || 'Error al eliminar el producto.';
          this.toastr.error(msg, 'Error');
        }
      });
    }
  }

  createNewProduct(): void {
    this.router.navigate(['/admin/products/new']); // Uso de router.navigate
  }

  // Lógica de filtrado para la vista
  get filteredProducts(): Producto[] {
    if (this.filterStatus === 'all') {
      return this.products;
    } else if (this.filterStatus === 'available') {
      return this.products.filter(p => p.disponible && p.stock > 0);
    } else if (this.filterStatus === 'unavailable') {
      return this.products.filter(p => !p.disponible || p.stock === 0);
    }
    return this.products; // Fallback
  }

  // Ayuda para mostrar el nombre de la categoría si está populada
  getCategoryName(producto: Producto): string {
    if (typeof producto.categoriaId === 'object' && producto.categoriaId !== null) {
      return producto.categoriaId.nombre;
    }
    return 'N/A'; // O un valor por defecto si no está populado o no es un objeto
  }

  // Obtener la URL de la primera imagen para mostrarla en la lista
  getProductImageUrl(producto: Producto): string {
    if (producto.imagenes && producto.imagenes.length > 0) {
      return producto.imagenes[0];
    }
    return 'assets/images/default-product.png'; // Imagen por defecto si no hay
  }
}