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
  productosEnOferta: any[] = [];
  filteredProductos: any[] = [];
  
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
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.loadCategories();
    this.loadProductosEnOferta();
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoriaService.getCategorias(true)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.categories = [];
          return of([]);
        }),
        finalize(() => {
          this.isLoadingCategories = false;
        })
      )
      .subscribe((categories: ICategoria[]) => {
        this.categories = categories;
      });
  }

  private loadProductosEnOferta(): void {
    this.isLoadingOfertas = true;
    this.ofertaService.getProductosEnOferta()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.productosEnOferta = [];
          this.filteredProductos = [];
          this.hasError = true;
          this.errorMessage = 'Error al cargar los productos en oferta. Por favor, intenta de nuevo.';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingOfertas = false;
          this.isLoading = false;
        })
      )
      .subscribe((productos: any[]) => {
        this.productosEnOferta = productos;
        this.filteredProductos = [...this.productosEnOferta];
        this.applyFilters();
      });
  }

  private applyFilters(): void {
    let filtered = [...this.productosEnOferta];
    if (this.selectedCategoryId) {
      filtered = filtered.filter(prod => prod.categoriaId === this.selectedCategoryId);
    }
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(prod =>
        prod.nombre.toLowerCase().includes(searchLower) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(searchLower))
      );
    }
    this.filteredProductos = filtered;
  }

  onCategorySelected(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  onSearchInput(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearCategoryFilter(): void {
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  onProductoSelected(producto: any): void {
    this.toastr.info(`Oferta: ${producto.oferta.nombre} - ${producto.oferta.porcentajeDescuento}% de descuento`, 'Detalles de Oferta');
  }

  onAddToCart(producto: any): void {
    this.toastr.info('Las ofertas se aplican automáticamente como descuentos a los productos', 'Información');
  }

  onBuyNow(producto: any): void {
    if (!this.authService.isAuthenticated()) {
      this.toastr.warning('Debes iniciar sesión para realizar una compra', 'Autenticación requerida');
      return;
    }
    const userRole = this.authService.getRole();
    if (userRole !== 'cliente') {
      this.toastr.error('Solo los clientes pueden realizar compras', 'Acceso denegado');
      return;
    }
    // Aquí podrías implementar la lógica de compra directa
  }

  retry(): void {
    this.loadInitialData();
  }
} 