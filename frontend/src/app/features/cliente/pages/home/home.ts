import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, catchError, finalize } from 'rxjs';
import { of } from 'rxjs';

// Importar servicios existentes
import { ProductoService } from '../../../../data/services/producto';
import { CategoriaService } from '../../../../data/services/categoria';
import { ComboService } from '../../../../data/services/combo';
import { OfertaService } from '../../../../data/services/oferta';
import { CartService } from '../../../../core/services/cart.service';

// Importar interfaces
import { IProducto, ICategoria } from '../../../../shared/interfaces';
import { MainButton, HomeState } from './home.interfaces';

// Importar componentes hijos
import { MainNavigation } from '../components/main-navigation/main-navigation';
import { CategoryTabs } from '../components/category-tabs/category-tabs';
import { ProductGrid } from '../components/product-grid/product-grid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MainNavigation,
    CategoryTabs,
    ProductGrid
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  // Estados de carga
  isLoading = false;
  isLoadingCategories = false;
  isLoadingProducts = false;
  isLoadingCombos = false;
  isLoadingOfertas = false;

  // Estados de error
  errorMessage = '';
  hasError = false;

  // Datos
  categories: ICategoria[] = [];
  products: IProducto[] = [];
  filteredProducts: IProducto[] = [];
  combos: any[] = [];
  ofertas: any[] = [];

  // Navegación
  activeSection: 'categorias' | 'combos' | 'ofertas' = 'categorias';
  selectedCategoryId: string | null = null;

  // Botones principales
  mainButtons: MainButton[] = [
    { name: 'Categorías', active: true, key: 'categorias' },
    { name: 'Combos', active: false, key: 'combos' },
    { name: 'Ofertas', active: false, key: 'ofertas' }
  ];

  // Computed properties
  get isCategoriasActive(): boolean {
    return this.activeSection === 'categorias';
  }

  get isCombosActive(): boolean {
    return this.activeSection === 'combos';
  }

  get isOfertasActive(): boolean {
    return this.activeSection === 'ofertas';
  }

  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private comboService: ComboService,
    private ofertaService: OfertaService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales de la aplicación
   */
  private loadInitialData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Cargar categorías primero
    this.loadCategories().then(() => {
      // Una vez cargadas las categorías, cargar productos de la primera categoría
      if (this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0]._id || null;
        this.loadProductsByCategory(this.selectedCategoryId);
      } else {
        this.isLoading = false;
      }
    }).catch(error => {
      this.handleError(error);
    });
  }

  /**
   * Carga todas las categorías activas
   */
  private async loadCategories(): Promise<void> {
    this.isLoadingCategories = true;
    
    try {
      const categories = await this.categoriaService.getCategorias(true).toPromise();
      this.categories = categories || [];
      this.isLoadingCategories = false;
    } catch (error) {
      this.isLoadingCategories = false;
      throw error;
    }
  }

  /**
   * Carga productos por categoría
   */
  private loadProductsByCategory(categoryId: string | null): void {
    if (!categoryId) {
      this.filteredProducts = [];
      this.isLoading = false;
      return;
    }

    this.isLoadingProducts = true;
    
    this.categoriaService.getProductosByCategoria(categoryId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading products by category:', error);
          this.filteredProducts = [];
          return of([]);
        }),
        finalize(() => {
          this.isLoadingProducts = false;
          this.isLoading = false;
        })
      )
      .subscribe(products => {
        this.filteredProducts = products.filter(product => product.disponible);
      });
  }

  /**
   * Carga todos los combos activos
   */
  private loadCombos(): void {
    this.isLoadingCombos = true;
    
    this.comboService.getCombos()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading combos:', error);
          this.combos = [];
          return of([]);
        }),
        finalize(() => this.isLoadingCombos = false)
      )
      .subscribe(combos => {
        this.combos = combos.filter(combo => combo.activo);
      });
  }

  /**
   * Carga todas las ofertas activas
   */
  private loadOfertas(): void {
    this.isLoadingOfertas = true;
    
    this.ofertaService.getOfertas()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading ofertas:', error);
          this.ofertas = [];
          return of([]);
        }),
        finalize(() => this.isLoadingOfertas = false)
      )
      .subscribe(ofertas => {
        this.ofertas = ofertas.filter(oferta => oferta.estado);
      });
  }

  /**
   * Maneja la selección de botón principal (Categorías, Combos, Ofertas)
   */
  onMainButtonSelected(buttonKey: string): void {
    // Actualizar estado de botones
    this.mainButtons.forEach(button => {
      button.active = button.key === buttonKey;
    });

    // Actualizar sección activa
    this.activeSection = buttonKey as 'categorias' | 'combos' | 'ofertas';

    // Cargar datos según la sección seleccionada
    switch (buttonKey) {
      case 'categorias':
        if (this.categories.length === 0) {
          this.loadCategories();
        }
        if (this.selectedCategoryId) {
          this.loadProductsByCategory(this.selectedCategoryId);
        }
        break;
      case 'combos':
        if (this.combos.length === 0) {
          this.loadCombos();
        }
        break;
      case 'ofertas':
        if (this.ofertas.length === 0) {
          this.loadOfertas();
        }
        break;
    }
  }

  /**
   * Maneja la selección de categoría
   */
  onCategorySelected(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.loadProductsByCategory(categoryId);
  }

  /**
   * Maneja la selección de producto
   */
  onProductSelected(product: IProducto): void {
    console.log('Producto seleccionado:', product);
    // Aquí puedes implementar la lógica para agregar al carrito
    // o navegar a la página de detalles del producto
  }

  /**
   * Maneja la adición de producto al carrito
   */
  onAddToCart(product: IProducto): void {
    this.cartService.addToCart(product, 1);
    console.log('Producto agregado al carrito:', product.nombre);
    // Aquí podrías mostrar una notificación de éxito
  }

  /**
   * Maneja errores de manera centralizada
   */
  private handleError(error: any): void {
    console.error('Error en Home component:', error);
    this.errorMessage = 'Error al cargar los datos. Por favor, intenta nuevamente.';
    this.hasError = true;
    this.isLoading = false;
    this.isLoadingCategories = false;
    this.isLoadingProducts = false;
    this.isLoadingCombos = false;
    this.isLoadingOfertas = false;
  }

  /**
   * Reintenta cargar los datos
   */
  retry(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.loadInitialData();
  }
}
