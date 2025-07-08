import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth'; // Asegúrate de que la ruta sea './services/auth'
import { Subject, debounceTime, distinctUntilChanged, switchMap, interval, Subscription, timer, tap } from 'rxjs';
import { OfertaCardComponent } from '../oferta-card/oferta-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oferta-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, OfertaCardComponent],
  templateUrl: './oferta-list.component.html',
  styleUrl: './oferta-list.component.css'
})
export class OfertaListComponent implements OnInit, OnDestroy {
  ofertas: Oferta[] = []; // Todas las ofertas cargadas desde el servicio
  ofertasVisibles: Oferta[] = []; // Las ofertas que se muestran en la UI después de filtros y búsqueda
  terminoBusqueda: string = '';
  private searchSubject = new Subject<string>();
  private verificacionSubscription?: Subscription;

  productosDisponibles: Producto[] = [];
  categoriasDisponibles: Categoria[] = [];

  errorCarga: string = '';
  cargando: boolean = false;
  ultimaVerificacion: Date = new Date();

  @ViewChild('ofertaSearchInput') ofertaSearchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // El searchSubject ahora solo dispara la carga principal de ofertas
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.cargarOfertas()) // Llama a cargarOfertas que aplicará filtros y búsqueda
    ).subscribe();
  }

  ngOnInit(): void {
    this.cargarOfertas(); // Carga inicial de ofertas
    this.cargarProductos();
    this.cargarCategorias();

    this.iniciarVerificacionAutomatica();
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId) && sessionStorage.getItem('focusOfertaSearch') === '1') {
        this.irABuscarOferta();
        sessionStorage.removeItem('focusOfertaSearch');
      }
    }, 400);
  }

  ngOnDestroy(): void {
    if (this.verificacionSubscription) {
      this.verificacionSubscription.unsubscribe();
    }
    this.searchSubject.unsubscribe(); // No olvidar desuscribirse del searchSubject
  }

  iniciarVerificacionAutomatica(): void {
    this.verificarOfertasExpiradas();

    this.verificacionSubscription = interval(60000).subscribe(() => {
      this.verificarOfertasExpiradas();
    });
  }

  verificarOfertasExpiradas(): void {
    const ofertasParaDesactivar = this.ofertaService.getOfertasParaDesactivar(this.ofertas);

    if (ofertasParaDesactivar.length > 0) {
      console.log(`Se encontraron ${ofertasParaDesactivar.length} ofertas expiradas`);

      ofertasParaDesactivar.forEach(oferta => {
        if (oferta._id) {
          this.ofertaService.desactivarOferta(oferta._id).subscribe({
            next: () => {
              console.log(`Oferta "${oferta.nombre}" desactivada automáticamente por expiración`);
              const index = this.ofertas.findIndex(o => o._id === oferta._id);
              if (index !== -1) {
                this.ofertas[index].estado = false;
              }
              this.aplicarFiltrosYBusqueda(); // Reaplicar filtros y búsqueda después de la actualización
            },
            error: (error) => {
              console.error(`Error al desactivar oferta expirada "${oferta.nombre}":`, error);
            }
          });
        }
      });
      this.ultimaVerificacion = new Date();
    }
  }

  cargarOfertas(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.ofertaService.getOfertas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas; // Almacena todas las ofertas
        this.aplicarFiltrosYBusqueda(); // Aplica filtros y búsqueda sobre las ofertas cargadas
        this.verificarOfertasExpiradas(); // Verifica expiradas después de cargar y filtrar
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        if (error.status === 401) {
          this.errorCarga = 'Debes iniciar sesión para ver las ofertas.';
        } else if (error.status === 403) {
          this.errorCarga = 'No tienes permisos para ver las ofertas.';
        } else {
          this.errorCarga = 'Error al cargar las ofertas.';
        }
        this.ofertas = [];
        this.ofertasVisibles = [];
      }
    });
  }

  // Nueva función para aplicar todos los filtros y la búsqueda
  aplicarFiltrosYBusqueda(): void {
    let tempOfertas = [...this.ofertas]; // Trabaja con una copia de todas las ofertas

    // 1. Filtrar por rol
    const userRole = this.authService.getRole();
    if (userRole === 'cliente') {
      tempOfertas = tempOfertas.filter(oferta =>
        oferta.estado === true && !this.ofertaService.verificarOfertaExpirada(oferta)
      );
    } else if (userRole === 'admin' || userRole === 'supervisor_ventas') {
      // Admin y supervisor de ventas ven todas las ofertas
    } else {
      tempOfertas = []; // Otros roles no ven ofertas
    }

    // 2. Aplicar filtro de búsqueda sobre las ofertas ya filtradas por rol
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino) {
      tempOfertas = tempOfertas.filter(oferta =>
        oferta.nombre.toLowerCase().includes(termino) ||
        (oferta.descripcion && oferta.descripcion.toLowerCase().includes(termino))
      );
    }

    this.ofertasVisibles = tempOfertas; // Actualiza las ofertas que se muestran en la UI
  }

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasDisponibles = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  // Este método ahora solo actualiza el término de búsqueda y dispara el Subject
  onSearchInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.terminoBusqueda = value; // Actualiza la propiedad del componente
    this.searchSubject.next(value); // Dispara el debounce
  }

  eliminarOferta(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta? Esta acción es irreversible.')) {
      this.ofertaService.eliminarOferta(id).subscribe({
        next: () => {
          this.cargarOfertas(); // Recarga todas las ofertas y reaplica filtros
        },
        error: (error) => {
          console.error('Error al eliminar oferta:', error);
          alert('Error al eliminar la oferta. Asegúrate de tener los permisos adecuados.');
        }
      });
    }
  }

  activarOferta(id: string): void {
    this.ofertaService.activarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas(); // Recarga todas las ofertas y reaplica filtros
      },
      error: (error) => {
        console.error('Error al activar oferta:', error);
        alert('Error al activar la oferta. Asegúrate de tener los permisos adecuados.');
      }
    });
  }

  desactivarOferta(id: string): void {
    this.ofertaService.desactivarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas(); // Recarga todas las ofertas y reaplica filtros
      },
      error: (error) => {
        console.error('Error al desactivar oferta:', error);
        alert('Error al desactivar la oferta');
      }
    });
  }

  editarOferta(oferta: Oferta): void {
    this.router.navigate(['/editar-oferta', oferta._id]);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicarFiltrosYBusqueda(); // Aplica filtros y búsqueda (sin término de búsqueda)
  }

  irABuscarOferta() {
    if (this.ofertaSearchInput && this.ofertaSearchInput.nativeElement) {
      this.ofertaSearchInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.ofertaSearchInput.nativeElement.focus(), 400);
    }
  }
}
