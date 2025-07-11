import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, catchError, finalize } from 'rxjs';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Importar servicios
import { OfertaService } from '../../../../data/services/oferta';
import { CategoriaService } from '../../../../data/services/categoria';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/auth/auth';

// Importar interfaces
import { IOfertaPopulated } from '../../../../shared/oferta.interface';
import { ICategoria } from '../../../../shared/interfaces';

// Importar componentes
import { CategoryTabs } from '../components/category-tabs/category-tabs';
import { OfertaGrid } from '../components/oferta-grid/oferta-grid';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryTabs, OfertaGrid],
  templateUrl: './ofertas.html',
  styleUrl: './ofertas.css'
})
export class OfertasComponent implements OnInit, OnDestroy {
  // Estados de carga
  isLoading = false;
  isLoadingCategories = false;
  isLoadingOfertas = false;

  // Datos
  categories: ICategoria[] = [];
  allOfertas: IOfertaPopulated[] = [];
  filteredOfertas: IOfertaPopulated[] = [];
  
  // Filtros
  selectedCategoryId: string | null = null;
  searchTerm: string = '';

  // Manejo de errores
  errorMessage = '';
  hasError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ofertaService: OfertaService,
    private categoriaService: CategoriaService,
    private cartService: CartService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('🎯 Iniciando página de ofertas...');
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos iniciales
   */
  private loadInitialData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Cargar categorías y ofertas en paralelo
    this.loadCategories();
    this.loadAllOfertas();
  }

  /**
   * Carga todas las categorías activas
   */
  private loadCategories(): void {
    console.log('📂 Cargando categorías...');
    this.isLoadingCategories = true;
    
    this.categoriaService.getCategorias(true)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error loading categories:', error);
          this.categories = [];
          return of([]);
        }),
        finalize(() => {
          this.isLoadingCategories = false;
        })
      )
      .subscribe((categories: ICategoria[]) => {
        console.log('✅ Categorías cargadas:', categories.length);
        this.categories = categories;
      });
  }

  /**
   * Carga todas las ofertas activas
   */
  private loadAllOfertas(): void {
    console.log('🏷️ Cargando todas las ofertas...');
    this.isLoadingOfertas = true;
    
    this.ofertaService.getOfertas()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error loading ofertas:', error);
          this.allOfertas = [];
          this.filteredOfertas = [];
          this.hasError = true;
          this.errorMessage = 'Error al cargar las ofertas. Por favor, intenta de nuevo.';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingOfertas = false;
          this.isLoading = false;
        })
      )
      .subscribe((ofertas: IOfertaPopulated[]) => {
        console.log('📦 Ofertas recibidas:', ofertas.length);
        
        // Filtrar solo ofertas activas
        const ofertasActivas = ofertas.filter(oferta => oferta.activa);
        console.log('✅ Ofertas activas:', ofertasActivas.length);
        
        this.allOfertas = ofertasActivas;
        this.filteredOfertas = [...this.allOfertas];
        this.applyFilters();
      });
  }

  /**
   * Aplica los filtros actuales
   */
  private applyFilters(): void {
    let filtered = [...this.allOfertas];

    // Filtrar por categoría
    if (this.selectedCategoryId) {
      filtered = filtered.filter(oferta => {
        // Verificar si la oferta tiene categorías aplicables
        if (oferta.categoriasAplicables && Array.isArray(oferta.categoriasAplicables)) {
          return oferta.categoriasAplicables.some((cat: any) => 
            (typeof cat === 'string' && cat === this.selectedCategoryId) ||
            (typeof cat === 'object' && cat._id === this.selectedCategoryId)
          );
        }
        return false;
      });
    }

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(oferta => 
        oferta.nombre.toLowerCase().includes(searchLower) ||
        (oferta.descripcion && oferta.descripcion.toLowerCase().includes(searchLower))
      );
    }

    this.filteredOfertas = filtered;
    console.log('🔍 Ofertas filtradas:', this.filteredOfertas.length);
  }

  /**
   * Maneja la selección de categoría
   */
  onCategorySelected(categoryId: string): void {
    console.log('📂 Categoría seleccionada:', categoryId);
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  /**
   * Maneja la búsqueda
   */
  onSearchInput(): void {
    this.applyFilters();
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  /**
   * Limpia el filtro de categoría
   */
  clearCategoryFilter(): void {
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  /**
   * Maneja la selección de oferta
   */
  onOfertaSelected(oferta: IOfertaPopulated): void {
    console.log('🏷️ Oferta seleccionada:', oferta);
    // Aquí puedes implementar la lógica para mostrar detalles de la oferta
    this.toastr.info(`Oferta: ${oferta.nombre} - ${oferta.porcentajeDescuento}% de descuento`, 'Detalles de Oferta');
  }

  /**
   * Maneja la adición de oferta al carrito
   */
  onAddToCart(oferta: IOfertaPopulated): void {
    // Las ofertas no se pueden agregar directamente al carrito
    // Se aplican como descuentos a los productos
    this.toastr.info('Las ofertas se aplican automáticamente como descuentos a los productos', 'Información');
  }

  /**
   * Maneja la compra directa de una oferta
   */
  onBuyNow(oferta: IOfertaPopulated): void {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.toastr.warning('Debes iniciar sesión para realizar una compra', 'Autenticación requerida');
      // Aquí podrías redirigir al login con returnUrl
      return;
    }

    // Verificar si el usuario tiene rol de cliente
    const userRole = this.authService.getRole();
    if (userRole !== 'cliente') {
      this.toastr.error('Solo los clientes pueden realizar compras', 'Acceso denegado');
      return;
    }

    // Redirigir a la página de productos para aplicar la oferta
    this.toastr.success('Redirigiendo a productos para aplicar la oferta', 'Aplicando Oferta');
    // Aquí podrías redirigir a productos con filtro de oferta
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