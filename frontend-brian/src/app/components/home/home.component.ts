import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComboService, Combo } from '../../services/combo.service';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { ComboCardComponent } from '../combo-card/combo-card.component';
import { OfertaCardComponent } from '../oferta-card/oferta-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ComboCardComponent, 
    OfertaCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Combos
  combos: Combo[] = [];
  combosFiltrados: Combo[] = [];
  cargandoCombos: boolean = false;
  errorCombos: string = '';
  
  // Carrusel de combos
  currentComboIndex: number = 0;
  maxComboIndex: number = 0;
  comboIndicators: number[] = [];
  
  // Ofertas
  ofertas: Oferta[] = [];
  ofertasFiltradas: Oferta[] = [];
  cargandoOfertas: boolean = false;
  errorOfertas: string = '';
  
  // Carrusel de ofertas
  currentOfertaIndex: number = 0;
  maxOfertaIndex: number = 0;
  ofertaIndicators: number[] = [];
  
  // Productos y categorías
  productos: Producto[] = [];
  productosDisponibles: Producto[] = [];
  categoriasDisponibles: Categoria[] = [];

  constructor(
    private comboService: ComboService,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.cargarCombos();
    this.cargarOfertas();
    
    // Solo cargar productos y categorías si es administrador
    if (this.authService.hasAdminPermissions()) {
      this.cargarProductos();
      this.cargarCategorias();
    }
    
    // Agregar listener para redimensionamiento de ventana solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy() {
    // Remover listener al destruir el componente solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  onResize() {
    // Reinicializar carruseles cuando cambie el tamaño de pantalla
    this.inicializarCarruselCombos();
    this.inicializarCarruselOfertas();
  }

  // Métodos para calcular cards visibles según pantalla
  getCardsVisibles(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 3; // Valor por defecto para SSR
    }
    
    if (window.innerWidth <= 480) {
      return 1; // Móviles: 1 card
    } else if (window.innerWidth <= 768) {
      return 2; // Tablets: 2 cards
    } else {
      return 3; // Desktop: 3 cards
    }
  }

  inicializarCarruselCombos() {
    this.currentComboIndex = 0;
    const cardsVisibles = this.getCardsVisibles();
    // Calculamos el máximo índice considerando las cards visibles
    this.maxComboIndex = Math.max(0, Math.ceil(this.combosFiltrados.length / cardsVisibles) - 1);
    this.comboIndicators = Array.from({ length: this.maxComboIndex + 1 }, (_, i) => i);
  }

  // Métodos del carrusel de combos
  prevCombo() {
    if (this.currentComboIndex > 0) {
      this.currentComboIndex--;
    }
  }

  nextCombo() {
    if (this.currentComboIndex < this.maxComboIndex) {
      this.currentComboIndex++;
    }
  }

  goToCombo(index: number) {
    this.currentComboIndex = index;
  }

  // Métodos para Combos
  cargarCombos() {
    this.cargandoCombos = true;
    this.errorCombos = '';
    
    this.comboService.getCombos().subscribe({
      next: (data) => {
        this.combos = data;
        this.filtrarCombosPorRol();
        this.inicializarCarruselCombos();
        this.cargandoCombos = false;
      },
      error: (error) => {
        this.cargandoCombos = false;
        if (error.status === 401) {
          this.errorCombos = 'Debes iniciar sesión para ver los combos.';
        } else if (error.status === 403) {
          this.errorCombos = 'No tienes permisos para ver los combos.';
        } else {
          this.errorCombos = 'Error al cargar los combos.';
        }
        this.combos = [];
        this.combosFiltrados = [];
      }
    });
  }

  filtrarCombosPorRol() {
    if (this.authService.isCliente()) {
      // Los clientes solo ven combos activos
      this.combosFiltrados = this.combos.filter(combo => combo.estado === true);
    } else {
      // Los administradores ven todos los combos
      this.combosFiltrados = [...this.combos];
    }
  }

  editarCombo(id: string) {
    this.router.navigate(['/editar-combo', id]);
  }

  eliminarCombo(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este combo?')) {
      this.comboService.deleteCombo(id).subscribe({
        next: () => {
          this.combos = this.combos.filter(combo => combo._id !== id);
          this.filtrarCombosPorRol();
          this.inicializarCarruselCombos();
        },
        error: (error: any) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el combo');
        }
      });
    }
  }

  activarCombo(id: string) {
    this.comboService.activarCombo(id).subscribe({
      next: (response: any) => {
        const comboActualizado = response.combo;
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error: any) => {
        console.error('Error al activar:', error);
        alert('Error al activar el combo');
      }
    });
  }

  desactivarCombo(id: string) {
    this.comboService.desactivarCombo(id).subscribe({
      next: (response: any) => {
        const comboActualizado = response.combo;
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error: any) => {
        console.error('Error al desactivar:', error);
        alert('Error al desactivar el combo');
      }
    });
  }

  actualizarComboEnListas(id: string, comboActualizado: any) {
    const indexPrincipal = this.combos.findIndex(combo => combo._id === id);
    if (indexPrincipal !== -1) {
      this.combos[indexPrincipal] = comboActualizado;
    }
    this.filtrarCombosPorRol();
    this.inicializarCarruselCombos();
  }

  // Métodos para Ofertas
  cargarOfertas() {
    this.cargandoOfertas = true;
    this.errorOfertas = '';
    
    this.ofertaService.getOfertas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.filtrarOfertasPorRol();
        this.inicializarCarruselOfertas();
        this.cargandoOfertas = false;
      },
      error: (error) => {
        this.cargandoOfertas = false;
        if (error.status === 401) {
          this.errorOfertas = 'Debes iniciar sesión para ver las ofertas.';
        } else if (error.status === 403) {
          this.errorOfertas = 'No tienes permisos para ver las ofertas.';
        } else {
          this.errorOfertas = 'Error al cargar las ofertas.';
        }
        this.ofertas = [];
        this.ofertasFiltradas = [];
      }
    });
  }

  filtrarOfertasPorRol() {
    if (this.authService.isCliente()) {
      // Los clientes solo ven ofertas activas
      this.ofertasFiltradas = this.ofertas.filter(oferta => oferta.estado === true);
    } else {
      // Los administradores ven todas las ofertas
      this.ofertasFiltradas = [...this.ofertas];
    }
  }

  inicializarCarruselOfertas() {
    this.currentOfertaIndex = 0;
    const cardsVisibles = this.getCardsVisibles();
    // Calculamos el máximo índice considerando las cards visibles
    this.maxOfertaIndex = Math.max(0, Math.ceil(this.ofertasFiltradas.length / cardsVisibles) - 1);
    this.ofertaIndicators = Array.from({ length: this.maxOfertaIndex + 1 }, (_, i) => i);
  }

  // Métodos del carrusel de ofertas
  prevOferta() {
    if (this.currentOfertaIndex > 0) {
      this.currentOfertaIndex--;
    }
  }

  nextOferta() {
    if (this.currentOfertaIndex < this.maxOfertaIndex) {
      this.currentOfertaIndex++;
    }
  }

  goToOferta(index: number) {
    this.currentOfertaIndex = index;
  }

  editarOferta(oferta: Oferta) {
    this.router.navigate(['/editar-oferta', oferta._id]);
  }

  eliminarOferta(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      this.ofertaService.eliminarOferta(id).subscribe({
        next: () => {
          this.cargarOfertas();
        },
        error: (error: any) => {
          console.error('Error al eliminar oferta:', error);
          alert('Error al eliminar la oferta');
        }
      });
    }
  }

  activarOferta(id: string) {
    this.ofertaService.activarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error: any) => {
        console.error('Error al activar oferta:', error);
        alert('Error al activar la oferta');
      }
    });
  }

  desactivarOferta(id: string) {
    this.ofertaService.desactivarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error: any) => {
        console.error('Error al desactivar oferta:', error);
        alert('Error al desactivar la oferta');
      }
    });
  }

  // Métodos para Productos y Categorías
  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosDisponibles = data;
      },
      error: (error: any) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar productos:', error);
        }
        this.productos = [];
        this.productosDisponibles = [];
      }
    });
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasDisponibles = categorias;
      },
      error: (error: any) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar categorías:', error);
        }
        this.categoriasDisponibles = [];
      }
    });
  }

  irABuscarCombos() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('focusComboSearch', '1');
    }
    this.router.navigate(['/combos']);
  }

  irABuscarOfertas() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('focusOfertaSearch', '1');
    }
    this.router.navigate(['/ofertas']);
  }
} 