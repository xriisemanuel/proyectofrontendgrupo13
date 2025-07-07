import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../data/services/producto';
import { Categoria } from '../../../data/services/categoria';
import { AuthService } from '../../../core/auth/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2'; //no quiero usar esto, en su lugar quiero usar algo mas moderno!

// Definir interfaces para Producto y Categoria
interface IProducto {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: { _id: string; nombre: string; } | string;
  imagenes: string[];
  disponible: boolean;
  stock: number;
  popularidad: number;
  categoriaNombre?: string;
  categoriaRealId?: string;
}

interface ICategoria {
  _id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: boolean;
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink]
})
export class HomePage implements OnInit, OnDestroy {
  // Propiedades para el login
  email: string = '';
  password: string = '';
  loginMessage: string = '';
  loginSuccess: boolean = false;

  // Propiedades para productos y categorías
  busqueda: string = '';
  productos: IProducto[] = [];
  productosFiltrados: IProducto[] = [];
  categorias: ICategoria[] = [];
  categoriaSeleccionadaId: string | null = null;
  categoriaSeleccionadaNombre: string = '';

  isLoadingProducts: boolean = true;
  isLoadingCategories: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private productoService: Producto,
    private categoriaService: Categoria,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Lógica de Login ---
  async handleLogin() {
    this.loginMessage = 'Iniciando sesión...';
    this.loginSuccess = false;

    this.authService.login(this.email, this.password).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response && response.token) {
          this.loginMessage = '¡Inicio de sesión exitoso! Redirigiendo...';
          this.loginSuccess = true;
          const userRole = this.authService.getRole();
          setTimeout(() => {
            switch (userRole) {
              case 'admin':
                this.router.navigate(['/admin/dashboard']);
                break;
              case 'cliente':
                this.router.navigate(['/cliente/dashboard']);
                break;
              case 'repartidor':
                this.router.navigate(['/repartidor/dashboard']);
                break;
              case 'supervisor_cocina':
                this.router.navigate(['/cocina/dashboard']);
                break;
              case 'supervisor_ventas':
                this.router.navigate(['/ventas/dashboard']);
                break;
              default:
                this.router.navigate(['/home']);
                break;
            }
          }, 1500);
        } else {
          this.loginMessage = response?.mensaje || 'Credenciales incorrectas.';
          this.loginSuccess = false;
        }
      },
      error: (err) => {
        console.error('Error en el login:', err);
        this.loginMessage = err.error?.mensaje || 'Error de conexión. Inténtalo de nuevo más tarde.';
        this.loginSuccess = false;
        Swal.fire('Error de Login', this.loginMessage, 'error');
      }
    });
  }

  // --- Lógica de Carga y Filtrado de Productos/Categorías ---
  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: ICategoria[]) => {
        this.categorias = data.filter(cat => cat.estado);
        this.isLoadingCategories = false;
        console.log('Categorías cargadas:', this.categorias);
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.isLoadingCategories = false;
        Swal.fire('Error de Carga', 'No se pudieron cargar las categorías.', 'error');
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productoService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: IProducto[]) => {
        this.productos = data.map(prod => {
          let categoriaIdToMatch: string;

          if (typeof prod.categoriaId === 'object' && prod.categoriaId !== null && '_id' in prod.categoriaId) {
            categoriaIdToMatch = String(prod.categoriaId._id);
          } else {
            categoriaIdToMatch = String(prod.categoriaId);
          }

          const categoria = this.categorias.find(c =>
            String(c._id) === categoriaIdToMatch
          );

          let realCategoriaId: string | undefined;
          if (typeof prod.categoriaId === 'object' && prod.categoriaId !== null && '_id' in prod.categoriaId) {
            realCategoriaId = String(prod.categoriaId._id);
          } else if (typeof prod.categoriaId === 'string') {
            realCategoriaId = prod.categoriaId;
          } else {
            realCategoriaId = undefined;
          }

          return {
            ...prod,
            categoriaNombre: categoria?.nombre || 'Sin categoría',
            categoriaRealId: realCategoriaId
          };
        }).filter(prod => prod.disponible && prod.stock > 0);

        this.productosFiltrados = [...this.productos];
        this.isLoadingProducts = false;
        console.log('Productos cargados:', this.productos);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.isLoadingProducts = false;
        Swal.fire('Error de Carga', 'No se pudieron cargar los productos.', 'error');
      }
    });
  }

  filtrarProductos(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter(p => {
      const coincideTexto = p.nombre?.toLowerCase().includes(texto) ||
                            p.descripcion?.toLowerCase().includes(texto) ||
                            p.categoriaNombre?.toLowerCase().includes(texto);

      const coincideCategoria = this.categoriaSeleccionadaId
        ? String(p.categoriaRealId) === this.categoriaSeleccionadaId
        : true;

      return coincideTexto && coincideCategoria;
    });
  }

  verProductosPorCategoria(categoriaId: string, categoriaNombre: string): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = categoriaId;
    this.categoriaSeleccionadaNombre = categoriaNombre;
    this.filtrarProductos();
    if (isPlatformBrowser(this.platformId)) {
        document.getElementById('productos-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  verTodosProductos(): void {
    this.busqueda = '';
    this.categoriaSeleccionadaId = null;
    this.categoriaSeleccionadaNombre = '';
    this.productosFiltrados = [...this.productos];
    if (isPlatformBrowser(this.platformId)) {
        document.getElementById('productos-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // --- Lógica de Carrito (Pública) ---
  agregarAlCarrito(producto: IProducto, event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: '¡Necesitas iniciar sesión!',
        text: 'Para agregar productos al carrito, por favor inicia sesión o regístrate.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ir a Iniciar Sesión',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    carrito.push(producto);
    localStorage.setItem('carrito', JSON.stringify(carrito));

    Swal.fire({
      title: '¡Agregado al carrito!',
      text: `${producto.nombre} ha sido añadido a tu carrito.`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Ir al Carrito',
      cancelButtonText: 'Seguir comprando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/carrito']);
      }
    });
  }
}
