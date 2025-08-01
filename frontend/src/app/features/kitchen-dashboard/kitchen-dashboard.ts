// src/app/components/kitchen-dashboard/kitchen-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common'; // Necesario para *ngIf, *ngFor, pipes
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { Router, RouterLink } from '@angular/router'; // Importación necesaria para Router y RouterLink

// Asegúrate de que las rutas a tus servicios sean CORRECTAS para tu proyecto
// Si tus archivos de servicio se llaman 'auth.service.ts', 'repartidor.service.ts', 'pedido.service.ts'
// entonces estas rutas son las correctas.
import { AuthService } from '../../core/auth/auth';
import { RepartidorService } from '../../data/services/repartidor'; // Asumo que lo necesitas o lo usarás
import { PedidoService } from '../../data/services/pedido';
import { IPedido, IClientePerfil, IUsuario } from '../../shared/interfaces'; // Asegúrate de que la ruta sea correcta
import { catchError, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [
    CommonModule, // Provee *ngIf, *ngFor, pipes (date, number, titlecase)
    FormsModule,  // Provee ngModel (para los filtros de input/select)
    RouterLink    // Provee la directiva routerLink si la usas en tu HTML para navegación
    // Agrega aquí cualquier otro componente o módulo standalone que uses en tu HTML
  ],
  templateUrl: './kitchen-dashboard.html',
  styleUrls: ['./kitchen-dashboard.css']
})
export class KitchenDashboard implements OnInit, OnDestroy {
  // === DECLARACIONES DE VARIABLES DE ESTADO Y MENSAJES ===
  errorMessage: string | null = null;
  successMessage: string | null = null;

  pedidos: IPedido[] = [];
  loading = true; // Para indicar si los datos están cargando
  selectedEstado: string = 'todos'; // Estado inicial del filtro - ahora muestra todos
  searchTerm: string = ''; // Término de búsqueda para el filtro
  showEntregados: boolean = false; // Control para mostrar pedidos entregados
  private searchTimeout: any; // Para debounce del buscador

  private pedidosSubscription: Subscription | undefined; // Para manejar la suscripción y evitar fugas de memoria

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService, // Inyectamos AuthService si lo necesitas para algo en este componente
    private repartidorService: RepartidorService, // Inyectamos RepartidorService si lo necesitas
    private router: Router, // Inyectamos Router para la navegación
    private toastr: ToastrService // Inyectamos ToastrService para mostrar notificaciones
  ) {}

  ngOnInit(): void {
    this.loadPedidos(); // Carga los pedidos al inicializar el componente
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar fugas de memoria cuando el componente se destruye
    this.pedidosSubscription?.unsubscribe();
  }

  /**
   * Carga los pedidos basándose en el estado seleccionado y el término de búsqueda.
   * Incluye opción para mostrar pedidos entregados junto con el estado seleccionado.
   */
  loadPedidos(): void {
    this.loading = true; // Activa el indicador de carga
    this.errorMessage = null; // Limpia cualquier mensaje de error anterior
    this.successMessage = null; // Limpia cualquier mensaje de éxito anterior

    // Determinar qué estados cargar
    let estadosACargar: string[] = [];
    
    if (this.selectedEstado === 'todos') {
      // Si seleccionamos "todos", cargar todos los estados excepto entregados por defecto
      estadosACargar = ['pendiente', 'confirmado', 'en_preparacion', 'en_envio', 'cancelado'];
      if (this.showEntregados) {
        estadosACargar.push('entregado');
      }
    } else {
      // Si seleccionamos un estado específico
      estadosACargar = [this.selectedEstado];
      // Si el estado seleccionado no es 'entregado' y showEntregados está activado, incluir entregados
      if (this.selectedEstado !== 'entregado' && this.showEntregados) {
        estadosACargar.push('entregado');
      }
    }

    console.log('Estados a cargar:', estadosACargar); // Debug

    // Llama al servicio de pedidos, pasando los estados como filtro
    this.pedidosSubscription = this.pedidoService.getPedidos(estadosACargar)
      .pipe(
        tap(data => {
          console.log('Pedidos recibidos del backend:', data.length); // Debug
          console.log('Estados de pedidos recibidos:', data.map(p => p.estado)); // Debug
          
          // Si hay un término de búsqueda, filtra los pedidos en el frontend
          if (this.searchTerm) {
            const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
            this.pedidos = data.filter(pedido =>
              pedido._id?.toLowerCase().includes(lowerCaseSearchTerm) ||
              this.getClienteFullName(pedido.clienteId).toLowerCase().includes(lowerCaseSearchTerm) ||
              pedido.detalleProductos.some(item => item.nombreProducto.toLowerCase().includes(lowerCaseSearchTerm)) ||
              pedido.direccionEntrega.toLowerCase().includes(lowerCaseSearchTerm)
            );
          } else {
            this.pedidos = data; // Asigna los pedidos recibidos sin filtrar
          }
          
          console.log('Pedidos finales después de filtros:', this.pedidos.length); // Debug
          this.loading = false; // Desactiva el indicador de carga
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar los pedidos:', error);
          this.errorMessage = `Error al cargar pedidos: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.loading = false; // Desactiva el indicador de carga incluso si hay error
          return of([]); // Retorna un observable vacío para que el stream continúe sin errores fatales
        })
      )
      .subscribe(); // Suscribirse al Observable para que se ejecute
  }

  /**
   * Cambia el estado de un pedido específico.
   * @param pedidoId El ID del pedido a actualizar.
   * @param newStatus El nuevo estado del pedido.
   */
  changeOrderStatus(pedidoId: string, newStatus: IPedido['estado']): void {
    this.pedidoService.updateEstadoPedido(pedidoId, newStatus)
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Estado del pedido ${pedidoId} actualizado a ${newStatus}`);
          this.loadPedidos(); // Recarga los pedidos para reflejar el cambio en la tabla
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar estado del pedido:', error);
          this.errorMessage = `Error al actualizar estado: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null); // Retorna un observable nulo para que el stream continúe
        })
      )
      .subscribe();
  }

  /**
   * Muestra un mensaje de éxito temporal en la interfaz de usuario.
   * @param message El mensaje de éxito a mostrar.
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message; // Asigna el mensaje de éxito
    setTimeout(() => {
      this.successMessage = null; // Oculta el mensaje después de 3 segundos
    }, 3000);
  }

  /**
   * Obtiene el nombre completo del cliente a partir de su perfil.
   * Maneja el caso en que usuarioId sea solo un string o un objeto IUsuario.
   * @param clientePerfil El perfil del cliente.
   * @returns El nombre completo del cliente o 'Cliente Desconocido'.
   */
  getClienteFullName(clientePerfil: IClientePerfil): string {
    if (clientePerfil && clientePerfil.usuarioId) {
      // Si usuarioId es un objeto y tiene nombre y apellido
      if (typeof clientePerfil.usuarioId === 'object' && 'nombre' in clientePerfil.usuarioId && 'apellido' in clientePerfil.usuarioId) {
        return `${clientePerfil.usuarioId.nombre} ${clientePerfil.usuarioId.apellido}`;
      } else if (typeof clientePerfil.usuarioId === 'string') {
        // Si usuarioId es solo el ID (string)
        return `Cliente (ID: ${clientePerfil.usuarioId})`;
      }
    }
    return 'Cliente Desconocido'; // En caso de que clienteId o usuarioId no estén definidos
  }

  /**
   * Función trackBy para *ngFor en la tabla de pedidos.
   * Mejora el rendimiento al ayudar a Angular a identificar elementos únicos en la lista.
   * @param index El índice del elemento.
   * @param pedido El objeto pedido.
   * @returns El ID único del pedido.
   */
  trackByPedidoId(index: number, pedido: IPedido): string | undefined {
    return pedido._id;
  }

  /**
   * Maneja la entrada en el campo de búsqueda con debounce.
   * Evita hacer demasiadas llamadas al servidor mientras el usuario escribe.
   */
  onSearchInput(): void {
    // Limpiar el timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Establecer un nuevo timeout para ejecutar la búsqueda después de 500ms
    this.searchTimeout = setTimeout(() => {
      this.loadPedidos();
    }, 500);
  }

  /**
   * Limpia el campo de búsqueda.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.loadPedidos();
  }

  /**
   * Limpia todos los filtros y restaura los valores por defecto.
   */
  clearAllFilters(): void {
    this.selectedEstado = 'todos';
    this.searchTerm = '';
    this.showEntregados = false;
    this.loadPedidos();
  }

  /**
   * Maneja la acción de cerrar sesión.
   * Llama al servicio de autenticación para cerrar la sesión y redirige al usuario.
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirige al usuario a la página de login
    this.toastr.info('Has cerrado sesión.', 'Sesión Terminada');
  }
}