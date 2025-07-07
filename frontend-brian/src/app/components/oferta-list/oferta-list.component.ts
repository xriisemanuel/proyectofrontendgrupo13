import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, interval, Subscription, timer } from 'rxjs';
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
  ofertas: Oferta[] = [];
  ofertasFiltradas: Oferta[] = [];
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
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termino => {
        if (termino.trim()) {
          return this.ofertaService.buscarOfertas(termino);
        } else {
          return this.ofertaService.getOfertas();
        }
      })
    ).subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.filtrarOfertasPorRol();
        this.verificarOfertasExpiradas();
      },
      error: (error) => {
        console.error('Error al buscar ofertas:', error);
      }
    });
  }

  ngOnInit(): void {
    // Cargar ofertas (ahora es público)
    this.cargarOfertas();
    // Solo cargar productos y categorías si es administrador (para mostrar en las cards)
    if (this.authService.hasAdminPermissions()) {
      this.cargarProductos();
      this.cargarCategorias();
    }
    
    // Iniciar verificación automática cada minuto
    this.iniciarVerificacionAutomatica();
    // Enfocar búsqueda si viene de Home
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId) && sessionStorage.getItem('focusOfertaSearch') === '1') {
        this.irABuscarOferta();
        sessionStorage.removeItem('focusOfertaSearch');
      }
    }, 400);
  }

  ngOnDestroy(): void {
    // Limpiar suscripción al destruir el componente
    if (this.verificacionSubscription) {
      this.verificacionSubscription.unsubscribe();
    }
  }

  iniciarVerificacionAutomatica(): void {
    // Verificar inmediatamente al cargar
    this.verificarOfertasExpiradas();
    
    // Luego verificar cada minuto
    this.verificacionSubscription = interval(60000).subscribe(() => {
      this.verificarOfertasExpiradas();
    });
  }

  verificarOfertasExpiradas(): void {
    // Verificar ofertas expiradas en el frontend
    const ofertasParaDesactivar = this.ofertaService.getOfertasParaDesactivar(this.ofertas);
    
    if (ofertasParaDesactivar.length > 0) {
      console.log(`Se encontraron ${ofertasParaDesactivar.length} ofertas expiradas`);
      
      // Desactivar ofertas expiradas
      ofertasParaDesactivar.forEach(oferta => {
        if (oferta._id) {
          this.ofertaService.desactivarOferta(oferta._id).subscribe({
            next: () => {
              console.log(`Oferta "${oferta.nombre}" desactivada automáticamente por expiración`);
              // Actualizar el estado local
              const index = this.ofertas.findIndex(o => o._id === oferta._id);
              if (index !== -1) {
                this.ofertas[index].estado = false;
              }
            },
            error: (error) => {
              console.error(`Error al desactivar oferta expirada "${oferta.nombre}":`, error);
            }
          });
        }
      });
      
      // Actualizar la lista filtrada
      this.filtrarOfertasPorRol();
      this.ultimaVerificacion = new Date();
    }
  }

  cargarOfertas(): void {
    this.cargando = true;
    this.errorCarga = '';
    
    this.ofertaService.getOfertas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.filtrarOfertasPorRol();
        this.verificarOfertasExpiradas(); // Verificar inmediatamente al cargar
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

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
      },
      error: (error) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar productos:', error);
        }
        this.productosDisponibles = [];
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasDisponibles = categorias;
      },
      error: (error) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar categorías:', error);
        }
        this.categoriasDisponibles = [];
      }
    });
  }

  buscarOfertas(): void {
    this.searchSubject.next(this.terminoBusqueda);
  }

  eliminarOferta(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      this.ofertaService.eliminarOferta(id).subscribe({
        next: () => {
          this.cargarOfertas();
        },
        error: (error) => {
          console.error('Error al eliminar oferta:', error);
          alert('Error al eliminar la oferta');
        }
      });
    }
  }

  activarOferta(id: string): void {
    this.ofertaService.activarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error) => {
        console.error('Error al activar oferta:', error);
        alert('Error al activar la oferta');
      }
    });
  }

  desactivarOferta(id: string): void {
    this.ofertaService.desactivarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error) => {
        console.error('Error al desactivar oferta:', error);
        alert('Error al desactivar la oferta');
      }
    });
  }

  editarOferta(oferta: Oferta): void {
    // Redirigir a la página de edición de oferta
    this.router.navigate(['/editar-oferta', oferta._id]);
  }

  validarImagen(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.jpg';
  }

  irABuscarOferta() {
    if (this.ofertaSearchInput && this.ofertaSearchInput.nativeElement) {
      this.ofertaSearchInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.ofertaSearchInput.nativeElement.focus(), 400);
    }
  }

  // Método para obtener el tiempo restante de una oferta
  getTiempoRestante(oferta: Oferta): string {
    if (!oferta.fechaFin || !oferta.estado) {
      return 'N/A';
    }
    
    const fechaFin = new Date(oferta.fechaFin);
    const fechaActual = new Date();
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    
    if (diferencia <= 0) {
      return 'Expirada';
    }
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
      return `${dias}d ${horas}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos}m`;
    }
  }

  // Método para verificar si una oferta está próxima a expirar (menos de 24 horas)
  isProximaAExpiracion(oferta: Oferta): boolean {
    if (!oferta.fechaFin || !oferta.estado) {
      return false;
    }
    
    const fechaFin = new Date(oferta.fechaFin);
    const fechaActual = new Date();
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    const horasRestantes = diferencia / (1000 * 60 * 60);
    
    return horasRestantes > 0 && horasRestantes <= 24;
  }
} 