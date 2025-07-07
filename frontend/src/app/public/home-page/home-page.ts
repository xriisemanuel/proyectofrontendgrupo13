
// src/app/public/home-page/home-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importante para [routerLink]
import { Observable, forkJoin } from 'rxjs'; // Para llamadas asíncronas
import { take, tap, catchError } from 'rxjs/operators'; // Para observables
import { of } from 'rxjs'; // Para manejar errores en forkJoin

// Importa tus modelos y servicios
import { ProductService } from '../../features/products/producto'; // Tu servicio de productos
import { Producto } from '../../features/products/models/producto.model'; // Tu modelo de producto

import { CategoriaService } from '../../features/categories/categoria'; // Tu servicio de categorías
import { ICategoria } from '../../features/categories/models/categoria.model'; // Tu modelo de categoría

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule // Necesario para [routerLink]
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePageComponent implements OnInit {

  products: Producto[] = [];
  categories: ICategoria[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private productService: ProductService,
    private categoriaService: CategoriaService // Asegúrate de que este servicio exista y funcione
  ) { }

  ngOnInit(): void {
    this.loadHomePageData();
  }

  loadHomePageData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Puedes ajustar el número de ítems que quieres mostrar en la homepage
    const products$ = this.productService.getProducts().pipe(
      take(8), // Por ejemplo, toma los primeros 8 productos
      catchError(error => {
        console.error('Error cargando productos para Home:', error);
        return of([]); // Retorna un array vacío si hay error para no bloquear el forkJoin
      })
    );

    const categories$ = this.categoriaService.getCategorias().pipe(
      take(4), // Por ejemplo, toma las primeras 4 categorías
      catchError(error => {
        console.error('Error cargando categorías para Home:', error);
        return of([]); // Retorna un array vacío si hay error para no bloquear el forkJoin
      })
    );

    forkJoin([products$, categories$]).subscribe({
      next: ([productsData, categoriesData]) => {
        this.products = productsData;
        this.categories = categoriesData;
        this.isLoading = false;
        console.log('Datos de Home cargados:', this.products, this.categories);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar algunos datos. Inténtalo de nuevo más tarde.';
        console.error('Error al cargar datos combinados de Home:', err);
      }
    });
  }

  getProductImageUrl(product: Producto): string {
    if (product.imagenes && product.imagenes.length > 0) {
      return product.imagenes[0];
    }
    return 'assets/images/default-product.png'; // Asegúrate de tener una imagen por defecto
  }

  // Puedes añadir un método para navegar a la página de detalle del producto si tienes una
  // navigateToProductDetail(productId: string): void {
  //   this.router.navigate(['/products', productId]);
  // }
}