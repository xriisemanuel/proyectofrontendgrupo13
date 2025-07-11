import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, catchError, finalize } from 'rxjs';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Importar servicios
import { ComboService } from '../../../../data/services/combo';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/auth/auth';

// Importar interfaces
import { ICombo } from '../../../../shared/interfaces';

// Importar componentes
import { ComboGrid } from '../components/combo-grid/combo-grid';

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [CommonModule, FormsModule, ComboGrid],
  templateUrl: './combos.html',
  styleUrl: './combos.css'
})
export class CombosComponent implements OnInit, OnDestroy {
  // Estados de carga
  isLoading = false;
  isLoadingCombos = false;

  // Datos
  allCombos: ICombo[] = [];
  filteredCombos: ICombo[] = [];
  
  // Filtros
  searchTerm: string = '';

  // Manejo de errores
  errorMessage = '';
  hasError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private comboService: ComboService,
    private cartService: CartService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('🎯 Iniciando página de combos...');
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

    // Cargar combos
    this.loadAllCombos();
  }

  /**
   * Carga todos los combos activos
   */
  private loadAllCombos(): void {
    console.log('🍔 Cargando todos los combos...');
    this.isLoadingCombos = true;
    
    this.comboService.getCombos()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error loading combos:', error);
          this.allCombos = [];
          this.filteredCombos = [];
          this.hasError = true;
          this.errorMessage = 'Error al cargar los combos. Por favor, intenta de nuevo.';
          return of([]);
        }),
        finalize(() => {
          this.isLoadingCombos = false;
          this.isLoading = false;
        })
      )
      .subscribe((response: any) => {
        console.log('📦 Respuesta del servicio de combos:', response);
        
        let combos: ICombo[] = [];
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
        
        this.allCombos = combosActivos;
        this.filteredCombos = [...this.allCombos];
        this.applyFilters();
      });
  }

  /**
   * Aplica los filtros actuales
   */
  private applyFilters(): void {
    let filtered = [...this.allCombos];

    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(combo => 
        combo.nombre.toLowerCase().includes(searchLower) ||
        (combo.descripcion && combo.descripcion.toLowerCase().includes(searchLower))
      );
    }

    this.filteredCombos = filtered;
    console.log('🔍 Combos filtrados:', this.filteredCombos.length);
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
   * Maneja la selección de combo
   */
  onComboSelected(combo: any): void {
    console.log('🍔 Combo seleccionado:', combo);
    // Aquí puedes implementar la lógica para mostrar detalles del combo
  }

  /**
   * Maneja la adición de combo al carrito
   */
  onAddToCart(combo: any): void {
    this.cartService.addToCart(combo, 1);
    console.log('🍔 Combo agregado al carrito:', combo.nombre);
    this.toastr.success('Combo agregado al carrito', '¡Agregado!');
  }

  /**
   * Maneja la compra directa de un combo
   */
  onBuyNow(combo: any): void {
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

    // Agregar el combo al carrito y redirigir a realizar pedido
    this.cartService.addToCart(combo, 1);
    this.toastr.success('Combo agregado al carrito', 'Listo para comprar');
    // Aquí podrías redirigir a realizar pedido
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