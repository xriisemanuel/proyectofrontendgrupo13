// src/app/public/home-page/home-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Added OnDestroy for subscriptions
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Import Router
import { Observable, forkJoin, of, Subscription } from 'rxjs'; // For async calls and error handling, added Subscription
import { take, tap, catchError } from 'rxjs/operators'; // For observables

// Import your models and services
import { ProductoService } from '../../data/services/producto'; // Your product service (corrected path)
import { CategoriaService } from '../../data/services/categoria'; // Your category service (corrected path)
import { IProducto, ICategoria } from '../../shared/interfaces'; // Your product and category models

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule // Necessary for [routerLink]
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css']
})
export class HomePageComponent implements OnInit, OnDestroy { // Implemented OnDestroy

  products: IProducto[] = [];
  categories: ICategoria[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  private subscriptions: Subscription[] = []; // To manage subscriptions

  constructor(
    private productService: ProductoService,
    private categoriaService: CategoriaService, // Make sure this service exists and works
    private router: Router // Injected Router service
  ) { }

  ngOnInit(): void {
    this.loadHomePageData();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadHomePageData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // You can adjust the number of items you want to display on the homepage
    const products$ = this.productService.getProducts().pipe(
      take(8), // For example, take the first 8 products
      catchError(error => {
        console.error('Error loading products for Home:', error);
        this.errorMessage = 'No se pudieron cargar los productos. Intente de nuevo más tarde.';
        return of([]); // Return an empty array if there is an error to not block forkJoin
      })
    );

    const categories$ = this.categoriaService.getCategorias().pipe(
      take(4), // For example, take the first 4 categories
      catchError(error => {
        console.error('Error loading categories for Home:', error);
        this.errorMessage = 'No se pudieron cargar las categorías. Intente de nuevo más tarde.'; // You could combine error messages
        return of([]); // Return an empty array if there is an error to not block forkJoin
      })
    );

    this.subscriptions.push(
      forkJoin([products$, categories$]).subscribe({
        next: ([productsData, categoriesData]) => {
          this.products = productsData;
          this.categories = categoriesData;
          this.isLoading = false;
          console.log('Home data loaded:', this.products, this.categories);
        },
        error: (err) => {
          this.isLoading = false;
          // If there is already an errorMessage from an individual catchError, do not overwrite it unless you want a more general message
          if (!this.errorMessage) {
            this.errorMessage = 'Ocurrió un error al cargar los datos de la página principal. Inténtalo de nuevo más tarde.';
          }
          console.error('Error loading combined Home data:', err);
        }
      })
    );
  }

  getProductImageUrl(product: IProducto): string {
    // Ensure 'product.imagen' is an array of strings and has at least one element
    if (product.imagen && product.imagen.length > 0 && typeof product.imagen[0] === 'string') {
      return product.imagen[0];
    }
    // Make sure this path is correct for your default image
    return 'https://placehold.co/300x200/282a36/f8f8f2?text=Producto';
  }

  /**
   * Handles the click on the "Comprar" button of a product card.
   * Redirects to the "realizar pedido" page, passing the product ID and a predefined quantity.
   * @param product The product to be purchased.
   */
  comprarProducto(product: IProducto): void {
    console.log('Comprar producto:', product.nombre);
    // Navigate to the orders page and pass the product ID and quantity as query parameters.
    // The 'realizar-pedido' component should read these parameters to pre-select the product.
    this.router.navigate(['/cliente/realizar-pedido'], { queryParams: { productId: product._id, quantity: 1 } });
    // Alternatively, if you have a shared cart service:
    // this.cartService.addItem(product, 1);
    // this.router.navigate(['/cliente/realizar-pedido']);
  }
}
