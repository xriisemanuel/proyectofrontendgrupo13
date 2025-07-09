import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importa Router
import { AuthService } from '../../core/auth/auth'; // Asegúrate de que la ruta sea correcta
import { ICliente, IUsuario } from '../../shared/interfaces'; // Importa ICliente y IUsuario
import { Subscription } from 'rxjs';
import { ClienteService } from '../../data/services/cliente'; // Asegúrate de que la ruta sea correcta
import { Observable, forkJoin, of } from 'rxjs';
import { take, tap, catchError, finalize } from 'rxjs/operators';

// Importa tus modelos y servicios
import { ProductoService } from '../../data/services/producto'; // Tu servicio de productos
import { CategoriaService } from '../../data/services/categoria'; // Tu servicio de categorías
import { IProducto, ICategoria } from '../../shared/interfaces'; // Tus modelos de producto y categoría

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css']
})
export class ClientDashboard implements OnInit, OnDestroy {
  cliente: ICliente | null = null;
  usuario: IUsuario | null = null; // Información del usuario asociada al cliente
  isLoading: boolean = true;
  errorMessage: string = '';

  products: IProducto[] = []; // Para almacenar productos destacados
  categories: ICategoria[] = []; // Para almacenar categorías

  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService); // Inyecta ProductoService
  private categoriaService = inject(CategoriaService); // Inyecta CategoriaService
  private router = inject(Router); // Inyecta Router

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadClientData();
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadClientData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cliente = null;
    this.usuario = null;

    const loggedInUserId = this.authService.getLoggedInUserId();
    const userRole = this.authService.getRole();

    console.log('ClientDashboard DEBUG: Usuario logueado ID:', loggedInUserId);
    console.log('ClientDashboard DEBUG: Rol del usuario logueado:', userRole);

    if (!loggedInUserId || userRole !== 'cliente') {
      this.errorMessage = 'No se pudo cargar el perfil del cliente. Asegúrate de estar logueado como cliente.';
      this.isLoading = false;
      console.error('ClientDashboard: Usuario no logueado o no es un cliente.');
      return;
    }

    this.subscriptions.push(
      this.clienteService.getClienteByUsuarioId(loggedInUserId).pipe(
        tap(data => {
          this.cliente = data;
          this.usuario = data.usuarioId;
          console.log('ClientDashboard: Datos del cliente cargados:', this.cliente);
        }),
        catchError(err => {
          console.error('ClientDashboard: Error al cargar datos del cliente:', err);
          this.errorMessage = err.error?.mensaje || 'Error al cargar tu perfil de cliente. Asegúrate de que tu perfil de cliente exista.';
          return of(null); // Retorna un observable nulo para que la cadena no se rompa
        }),
        finalize(() => {
          // Si hay un error en la carga del cliente, isLoading ya se habrá puesto en false
          // Si no hubo error, se pone en false aquí.
          if (!this.errorMessage) {
            this.isLoading = false;
          }
        })
      ).subscribe()
    );
  }

  loadProducts(): void {
    // Puedes ajustar el número de productos a cargar o añadir filtros
    this.productoService.getProducts().pipe(
      take(1), // Solo toma la primera emisión
      tap(products => {
        this.products = products.filter(p => p.disponible && p.stock > 0).slice(0, 8); // Mostrar algunos productos disponibles
        console.log('Productos cargados:', this.products.length);
      }),
      catchError(err => {
        console.error('Error al cargar productos:', err);
        // this.errorMessage = 'Error al cargar productos destacados.'; // Podrías añadir un mensaje específico
        return of([]);
      })
    ).subscribe();
  }

  loadCategories(): void {
    // Puedes ajustar el número de categorías a cargar o añadir filtros
    this.categoriaService.getCategorias(true).pipe( // Cargar solo categorías activas
      take(1),
      tap(categories => {
        this.categories = categories.slice(0, 6); // Mostrar algunas categorías
        console.log('Categorías cargadas:', this.categories.length);
      }),
      catchError(err => {
        console.error('Error al cargar categorías:', err);
        // this.errorMessage = 'Error al cargar categorías.'; // Podrías añadir un mensaje específico
        return of([]);
      })
    ).subscribe();
  }

  getProductImageUrl(product: IProducto): string {
    // Asegúrate de que 'product.imagen' sea una cadena o un array de cadenas y tenga al menos un elemento
    if (product.imagen && typeof product.imagen === 'string' && product.imagen.trim() !== '') {
      return product.imagen;
    }
    // Si 'product.imagen' es un array (como en tu interfaz ICategoria), puedes adaptarlo así:
    // if (Array.isArray(product.imagen) && product.imagen.length > 0 && typeof product.imagen[0] === 'string') {
    //   return product.imagen[0];
    // }
    // Ruta de la imagen por defecto si no hay imagen
    return 'https://placehold.co/300x200/172A45/CCD6F6?text=Producto';
  }

  getCategoryImageUrl(category: ICategoria): string {
    // Asegúrate de que 'category.imagen' sea una cadena o un array de cadenas y tenga al menos un elemento
    if (category.imagen && typeof category.imagen === 'string' && category.imagen.trim() !== '') {
      return category.imagen;
    }
    // Ruta de la imagen por defecto si no hay imagen
    return 'https://placehold.co/300x200/172A45/CCD6F6?text=Categoría';
  }

  comprarProducto(product: IProducto): void {
    console.log('Comprar producto:', product.nombre);
    this.router.navigate(['cliente/realizar-pedido'], { queryParams: { productId: product._id, quantity: 1 } });
  }

  // Métodos de navegación a otras partes del dashboard
  goToCalificaciones(): void {
    this.router.navigate(['/calificaciones']);
  }

  goToMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  goToEditProfile(): void {
    this.router.navigate(['/client/profile/edit']); // Ruta específica para editar el perfil del cliente
  }
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
