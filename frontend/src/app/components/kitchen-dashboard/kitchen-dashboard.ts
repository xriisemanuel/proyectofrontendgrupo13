// src/app/components/kitchen-dashboard/kitchen-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor, pipes
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { RouterLink } from '@angular/router'; // Importación necesaria para RouterLink

// Asegúrate de que las rutas a tus servicios sean CORRECTAS para tu proyecto
// Si tus archivos de servicio se llaman 'auth.service.ts', 'repartidor.service.ts', 'pedido.service.ts'
// entonces estas rutas son las correctas.
import { AuthService } from '../../services/auth';
import { RepartidorService } from '../../services/repartidor'; // Asumo que lo necesitas o lo usarás
import { PedidoService, IPedido, IDetalleProducto, IClientePopulated, IRepartidorPopulated } from '../../services/pedido';

import { catchError, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [
    CommonModule, // Provee *ngIf, *ngFor, pipes (date, number, titlecase)
    FormsModule,   // Provee ngModel (para los filtros de input/select)
    RouterLink     // Provee la directiva routerLink si la usas en tu HTML para navegación
    // Agrega aquí cualquier otro componente o módulo standalone que uses en tu HTML
  ],
  templateUrl: './kitchen-dashboard.html',
  styleUrls: ['./kitchen-dashboard.css']
})
export class KitchenDashboard implements OnInit, OnDestroy {
  // === DECLARACIONES DE VARIABLES DE ESTADO Y MENSAJES ===
  // Declaraciones exactas para los mensajes de error y éxito
  errorMessage: string | null = null;
  successMessage: string | null = null;

  pedidos: IPedido[] = [];
  loading = true; // Para indicar si los datos están cargando
  selectedEstado: string = 'pendiente'; // Estado inicial del filtro
  searchTerm: string = ''; // Término de búsqueda para el filtro

  private pedidosSubscription: Subscription | undefined; // Para manejar la suscripción y evitar fugas de memoria

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService, // Inyectamos AuthService si lo necesitas para algo en este componente
    private repartidorService: RepartidorService // Inyectamos RepartidorService si lo necesitas
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
   */
  loadPedidos(): void {
    this.loading = true; // Activa el indicador de carga
    this.errorMessage = null; // Limpia cualquier mensaje de error anterior
    this.successMessage = null; // Limpia cualquier mensaje de éxito anterior

    // Llama al servicio de pedidos, pasando el estado seleccionado como filtro
    // Asumimos que getPedidos en PedidoService ahora puede manejar un array de estados
    this.pedidosSubscription = this.pedidoService.getPedidos([this.selectedEstado])
      .pipe(
        tap(data => {
          this.pedidos = data; // Asigna los pedidos recibidos
          this.loading = false; // Desactiva el indicador de carga
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar los pedidos:', error);
          // Muestra un mensaje de error amigable, extrayéndolo de la respuesta del backend si está disponible
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
          // Muestra un mensaje de éxito
          this.showSuccessMessage(`Estado del pedido ${pedidoId} actualizado a ${newStatus}`);
          this.loadPedidos(); // Recarga los pedidos para reflejar el cambio en la tabla
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar estado del pedido:', error);
          // Muestra un mensaje de error
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

  // Puedes añadir un método para aplicar el filtro de búsqueda si tu backend lo soporta
  // applySearchFilter(): void {
  //   this.loadPedidos(); // Recarga los pedidos con el término de búsqueda actual
  // }
}