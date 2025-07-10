import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importa Router

// Importaciones de servicios e interfaces
import { AuthService } from '../../core/auth/auth'; // Asegúrate de que la ruta sea correcta
import { ClienteService } from '../../data/services/cliente'; // Asegúrate de que la ruta sea correcta
import { ProductoService } from '../../data/services/producto'; // Tu servicio de productos
import { CategoriaService } from '../../data/services/categoria'; // Tu servicio de categorías

// Importa tus modelos de interfaz
import { ICliente, IUsuario, IProducto, ICategoria } from '../../shared/interfaces'; // Importa todas las interfaces necesarias

import { Subscription, of, forkJoin } from 'rxjs'; // Importa forkJoin si lo necesitas para cargas paralelas
import { take, tap, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // Módulos necesarios para el template
  templateUrl: './client-dashboard.html', // Ruta al archivo HTML
  styleUrls: ['./client-dashboard.css'] // Ruta al archivo CSS
})
export class ClientDashboard implements OnInit, OnDestroy {
  // Propiedades para almacenar los datos del cliente y su estado
  cliente: ICliente | null = null;
  usuario: IUsuario | null = null; // Información del usuario asociada al cliente
  isLoading: boolean = true; // Indica si los datos principales están cargando
  errorMessage: string = ''; // Mensaje de error si algo falla

  // Propiedades para almacenar productos y categorías
  products: IProducto[] = []; // Para almacenar productos destacados
  categories: ICategoria[] = []; // Para almacenar categorías

  // Inyección de servicios a través de `inject`
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router); // Para la navegación programática

  // Gestión de suscripciones para evitar fugas de memoria
  private subscriptions: Subscription[] = [];

  /**
   * Método del ciclo de vida de Angular que se ejecuta al inicializar el componente.
   * Carga los datos del cliente, productos y categorías.
   */
  ngOnInit(): void {
    this.loadClientData();
    this.loadProducts();
    this.loadCategories();
  }

  /**
   * Método del ciclo de vida de Angular que se ejecuta al destruir el componente.
   * Desuscribe todas las suscripciones para evitar fugas de memoria.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Carga los datos del perfil del cliente y la información del usuario asociado.
   * Realiza una validación inicial del usuario logueado y su rol.
   */
  loadClientData(): void {
    this.isLoading = true; // Reinicia el estado de carga
    this.errorMessage = ''; // Limpia mensajes de error previos
    this.cliente = null;
    this.usuario = null;

    const loggedInUserId = this.authService.getLoggedInUserId();
    const userRole = this.authService.getRole();

    // Logs de depuración para verificar el estado de autenticación
    console.log('ClientDashboard DEBUG: Usuario logueado ID:', loggedInUserId);
    console.log('ClientDashboard DEBUG: Rol del usuario logueado:', userRole);

    // Si no hay ID de usuario logueado o el rol no es 'cliente', muestra un error.
    if (!loggedInUserId || userRole !== 'cliente') {
      this.errorMessage = 'No se pudo cargar el perfil del cliente. Asegúrate de estar logueado como cliente.';
      this.isLoading = false;
      console.error('ClientDashboard: Usuario no logueado o no es un cliente.');
      return;
    }

    // Suscribe a la carga de datos del cliente
    this.subscriptions.push(
      this.clienteService.getClienteByUsuarioId(loggedInUserId).pipe(
        tap(data => {
          this.cliente = data;
          // Asume que 'usuarioId' en ICliente es el objeto de usuario completo populado
          this.usuario = data.usuarioId;
          console.log('ClientDashboard: Datos del cliente cargados:', this.cliente);
        }),
        catchError(err => {
          console.error('ClientDashboard: Error al cargar datos del cliente:', err);
          this.errorMessage = err.error?.mensaje || 'Error al cargar tu perfil de cliente. Asegúrate de que tu perfil de cliente exista.';
          return of(null); // Retorna un observable nulo para que la cadena no se rompa
        }),
        finalize(() => {
          // Finaliza el estado de carga solo si no hay un error persistente
          if (!this.errorMessage) {
            this.isLoading = false;
          }
        })
      ).subscribe()
    );
  }

  /**
   * Carga una selección de productos destacados.
   * Filtra por disponibilidad y stock, y limita la cantidad mostrada.
   */
  loadProducts(): void {
    this.productoService.getProducts().pipe(
      take(1), // Solo toma la primera emisión del observable
      tap(products => {
        // Filtra productos disponibles y con stock, mostrando solo los primeros 8
        this.products = products.filter(p => p.disponible && p.stock > 0).slice(0, 8);
        console.log('Productos cargados:', this.products.length);
      }),
      catchError(err => {
        console.error('Error al cargar productos:', err);
        // Puedes añadir un mensaje de error específico para productos si lo deseas
        return of([]); // Retorna un array vacío en caso de error
      })
    ).subscribe();
  }

  /**
   * Carga una selección de categorías.
   * Carga solo categorías activas y limita la cantidad mostrada.
   */
  loadCategories(): void {
    this.categoriaService.getCategorias(true).pipe( // Asume que getCategorias(true) carga solo activas
      take(1), // Solo toma la primera emisión
      tap(categories => {
        // Muestra solo las primeras 6 categorías
        this.categories = categories.slice(0, 6);
        console.log('Categorías cargadas:', this.categories.length);
      }),
      catchError(err => {
        console.error('Error al cargar categorías:', err);
        // Puedes añadir un mensaje de error específico para categorías si lo deseas
        return of([]); // Retorna un array vacío en caso de error
      })
    ).subscribe();
  }

  /**
   * Obtiene la URL de la imagen de un producto.
   * Proporciona una imagen por defecto si no hay URL válida.
   * @param product El objeto producto.
   * @returns La URL de la imagen o una URL de placeholder.
   */
  getProductImageUrl(product: IProducto): string {
    // Asegúrate de que 'product.imagen' sea una cadena válida
    if (product.imagen && typeof product.imagen === 'string' && product.imagen.trim() !== '') {
      return product.imagen;
    }
    // URL de la imagen por defecto si no hay imagen
    return 'https://placehold.co/300x200/172A45/CCD6F6?text=Producto';
  }

  /**
   * Obtiene la URL de la imagen de una categoría.
   * Proporciona una imagen por defecto si no hay URL válida.
   * @param category El objeto categoría.
   * @returns La URL de la imagen o una URL de placeholder.
   */
  getCategoryImageUrl(category: ICategoria): string {
    // Asegúrate de que 'category.imagen' sea una cadena válida
    if (category.imagen && typeof category.imagen === 'string' && category.imagen.trim() !== '') {
      return category.imagen;
    }
    // URL de la imagen por defecto si no hay imagen
    return 'https://placehold.co/300x200/172A45/CCD6F6?text=Categoría';
  }

  /**
   * Maneja la acción de comprar un producto.
   * @param product El producto a comprar.
   */
  comprarProducto(product: IProducto): void {
    console.log('Comprar producto:', product.nombre);
    // Redirige a la página de realizar pedido con los parámetros del producto
    this.router.navigate(['/cliente/realizar-pedido'], { queryParams: { productId: product._id, quantity: 1 } });
  }

  /**
   * Redirige a la página de calificaciones.
   */
  goToCalificaciones(): void {
    this.router.navigate(['/calificaciones']);
  }

  /**
   * Redirige a la página de "Mis Pedidos".
   */
  goToMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  /**
   * Redirige a la página de edición del perfil del cliente.
   */
  goToEditProfile(): void {
    // Asegura que el usuario esté disponible antes de intentar navegar
    if (this.usuario && this.usuario._id) {
      this.router.navigate(['/client/profile/edit']);
    } else {
      console.warn('No se pudo redirigir a editar perfil: ID de usuario no disponible.');
    }
  }

  /**
   * Redirige a la página de "Realizar Pedido".
   */
  goToRealizarPedido(): void {
    this.router.navigate(['/cliente/realizar-pedido']);
  }

  /**
   * Redirige a la página de "Realizar Pedido" filtrando por una categoría específica.
   * @param category La categoría seleccionada
   */
  goToRealizarPedidoWithCategory(category: ICategoria): void {
    console.log('Navegando a realizar pedido con categoría:', category.nombre, 'ID:', category._id);
    console.log('Usuario autenticado:', this.authService.isAuthenticated());
    console.log('Rol del usuario:', this.authService.getRole());
    console.log('ID del usuario:', this.authService.getLoggedInUserId());
    
    this.router.navigate(['/cliente/realizar-pedido'], { 
      queryParams: { categoriaId: category._id } 
    }).then(() => {
      console.log('Navegación completada exitosamente');
    }).catch(error => {
      console.error('Error en la navegación:', error);
    });
  }

  /**
   * Cierra la sesión del usuario y redirige a la página de inicio.
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']); // Redirige a la página de inicio/login
  }
}
