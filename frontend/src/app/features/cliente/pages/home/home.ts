import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, finalize, firstValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Importar servicios existentes
import { ProductoService } from '../../../../data/services/producto';
import { CategoriaService } from '../../../../data/services/categoria';
import { ComboService } from '../../../../data/services/combo';
import { OfertaService } from '../../../../data/services/oferta';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/auth/auth';

// Importar interfaces
import { IProducto, ICategoria, ICombo } from '../../../../shared/interfaces';
import { IOfertaPopulated } from '../../../../shared/oferta.interface';

// Importar componentes hijos
import { CategoryTabs } from '../components/category-tabs/category-tabs';
import { ProductGrid } from '../components/product-grid/product-grid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
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
  combos: ICombo[] = [];
  ofertas: IOfertaPopulated[] = [];

  // Navegación
  selectedCategoryId: string | null = null;
  currentView: 'categorias' | 'combos' | 'ofertas' = 'categorias';

  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private comboService: ComboService,
    private ofertaService: OfertaService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en los parámetros de la URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const view = params['view'];
        if (view && ['categorias', 'combos', 'ofertas'].includes(view)) {
          this.currentView = view;
        } else {
          this.currentView = 'categorias';
        }
        this.loadInitialData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales de la aplicación según la vista actual
   */
  private loadInitialData(): void {
    console.log('🎯 Cargando datos para vista:', this.currentView);
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    switch (this.currentView) {
      case 'categorias':
        console.log('📂 Cargando categorías...');
        this.loadCategories()
          .then(() => {
            if (this.categories.length > 0) {
              this.selectedCategoryId = this.categories[0]._id || null;
              if (this.selectedCategoryId) {
                this.loadProductsByCategory(this.selectedCategoryId);
              } else {
                this.isLoading = false;
              }
            } else {
              this.isLoading = false;
            }
          })
          .catch(error => {
            this.handleError(error);
          });
        break;
      
      case 'combos':
        console.log('🍔 Cargando combos...');
        this.loadCombos();
        break;
      
      case 'ofertas':
        console.log('🏷️ Cargando ofertas...');
        this.loadOfertas();
        break;
      
      default:
        console.log('📂 Vista por defecto: cargando categorías...');
        this.loadCategories();
        break;
    }
  }

  /**
   * Carga todas las categorías activas
   */
  private async loadCategories(): Promise<void> {
    this.isLoadingCategories = true;
    
    try {
      const categories = await firstValueFrom(this.categoriaService.getCategorias(true));
      if (Array.isArray(categories)) {
        this.categories = categories || [];
      } else {
        console.error('Categories is not an array:', categories);
        this.categories = [];
      }
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
      .subscribe((response: any) => {
        // El backend devuelve { mensaje: string, productos: array }
        let products: any[] = [];
        if (Array.isArray(response)) {
          products = response;
        } else if (response && response.productos && Array.isArray(response.productos)) {
          products = response.productos;
        } else {
          console.error('Invalid products response:', response);
          products = [];
        }
        this.filteredProducts = products.filter((product: any) => product.disponible);
      });
  }

  /**
   * Carga todos los combos activos
   */
  private loadCombos(): void {
    console.log('🔄 Iniciando carga de combos...');
    this.isLoadingCombos = true;
    
    this.comboService.getCombos()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error loading combos:', error);
          this.combos = [];
          return of([]);
        }),
        finalize(() => {
          console.log('✅ Finalizada carga de combos');
          this.isLoadingCombos = false;
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        console.log('📦 Respuesta del servicio de combos:', response);
        // Los combos se devuelven directamente como array
        let combos: any[] = [];
        if (Array.isArray(response)) {
          combos = response;
          console.log('✅ Combos recibidos como array:', combos.length);
        } else if (response && response.combos && Array.isArray(response.combos)) {
          combos = response.combos;
          console.log('✅ Combos recibidos en propiedad combos:', combos.length);
        } else {
          console.error('❌ Invalid combos response:', response);
          combos = [];
        }
        
        const combosActivos = combos.filter((combo: any) => combo.activo);
        console.log('🎯 Combos activos filtrados:', combosActivos.length);
        this.combos = combosActivos;
      });
  }

  /**
   * Carga todas las ofertas activas
   */
  private loadOfertas(): void {
    console.log('🔄 Iniciando carga de ofertas...');
    this.isLoadingOfertas = true;
    
    this.ofertaService.getOfertas()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error loading ofertas:', error);
          this.ofertas = [];
          return of([]);
        }),
        finalize(() => {
          console.log('✅ Finalizada carga de ofertas');
          this.isLoadingOfertas = false;
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        console.log('📦 Respuesta del servicio de ofertas:', response);
        // Las ofertas se devuelven directamente como array
        let ofertas: any[] = [];
        if (Array.isArray(response)) {
          ofertas = response;
          console.log('✅ Ofertas recibidas como array:', ofertas.length);
        } else if (response && response.ofertas && Array.isArray(response.ofertas)) {
          ofertas = response.ofertas;
          console.log('✅ Ofertas recibidas en propiedad ofertas:', ofertas.length);
        } else {
          console.error('❌ Invalid ofertas response:', response);
          ofertas = [];
        }
        
        const ofertasActivas = ofertas.filter((oferta: any) => oferta.activa || oferta.estado);
        console.log('🎯 Ofertas activas filtradas:', ofertasActivas.length);
        this.ofertas = ofertasActivas;
      });
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
  onProductSelected(product: any): void {
    console.log('Producto seleccionado:', product);
    // Aquí puedes implementar la lógica para agregar al carrito
    // o navegar a la página de detalles del producto
  }

  /**
   * Maneja la adición de producto al carrito
   */
  onAddToCart(product: any): void {
    this.cartService.addToCart(product, 1);
    this.toastr.success('Producto agregado al carrito', 'Carrito');
    // No redirige automáticamente, solo muestra el toast
  }

  /**
   * Maneja la compra directa de un producto
   */
  onBuyNow(product: any): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.toastr.warning('Debes iniciar sesión para comprar', 'Autenticación requerida');
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: '/cart',
          productId: product._id 
        } 
      });
      return;
    }

    // Verificar si el usuario tiene rol de cliente
    const userRole = this.authService.getRole();
    if (userRole !== 'cliente') {
      this.toastr.error('Solo los clientes pueden comprar', 'Acceso denegado');
      return;
    }

    // Agregar el producto al carrito y redirigir al carrito
    this.cartService.addToCart(product, 1);
    this.toastr.success('Producto agregado al carrito', 'Listo para comprar');
    this.router.navigate(['/cart']);
  }

  /**
   * Maneja errores de carga
   */
  private handleError(error: any): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = error?.message || 'Error al cargar los datos. Por favor, intenta de nuevo.';
    console.error('Error in home component:', error);
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
