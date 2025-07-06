// src/app/components/delivery-dashboard/delivery-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor, pipes como date, number, titlecase
import { FormsModule } from '@angular/forms'; // Necesario para ngModel si lo usas en el futuro (ej. para inputs de calificación)

// ¡Rutas de importación corregidas! Asegúrate de que coincidan con tu estructura de archivos.
import { AuthService } from '../../services/auth';
import { RepartidorService, IRepartidor, IHistorialEntrega } from '../../services/repartidor';
import { PedidoService, IPedido } from '../../services/pedido'; // Ruta ajustada a pedido/pedido.service

import { catchError, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
    // Agrega aquí cualquier otro componente o módulo standalone que uses en tu HTML
  ],
  templateUrl: './delivery-dashboard.html', // Nombre de archivo HTML corregido
  styleUrls: ['./delivery-dashboard.css']
})
export class DeliveryDashboard implements OnInit, OnDestroy { // ¡Nombre de clase corregido!

  repartidor: IRepartidor | null = null;
  pedidosAsignados: IPedido[] = [];
  loadingRepartidor = true;
  loadingPedidos = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private repartidorSubscription: Subscription | undefined;
  private pedidosSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private repartidorService: RepartidorService,
    private pedidoService: PedidoService
  ) { }

  ngOnInit(): void {
    this.loadRepartidorData();
  }

  ngOnDestroy(): void {
    this.repartidorSubscription?.unsubscribe();
    this.pedidosSubscription?.unsubscribe();
  }

  /**
   * Carga los datos del perfil del repartidor autenticado.
   * Utiliza el ID de usuario del AuthService para obtener el perfil de repartidor.
   */
  //hola
  loadRepartidorData(): void {
    this.loadingRepartidor = true;
    this.errorMessage = null;
    const userId = this.authService.getLoggedInUserId();

    if (userId) {
      this.repartidorSubscription = this.repartidorService.getRepartidorByUserId(userId)
        .pipe(
          tap((repartidorData: IRepartidor) => {
            this.repartidor = repartidorData;
            this.loadingRepartidor = false;
            this.loadPedidosAsignados(); // Carga los pedidos una vez que el repartidor está cargado
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error al cargar los datos del repartidor:', error);
            this.errorMessage = `Error al cargar perfil: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
            this.loadingRepartidor = false;
            return of(null);
          })
        )
        .subscribe();
    } else {
      this.errorMessage = 'ID de usuario no encontrado. Por favor, inicie sesión.';
      this.loadingRepartidor = false;
    }
  }

  /**
   * Carga los pedidos asignados al repartidor actualmente logueado.
   * Filtra por estados relevantes para el repartidor (confirmado, en_preparacion, en_envio).
   */
  loadPedidosAsignados(): void {
    if (!this.repartidor?._id) {
      console.warn('No hay ID de repartidor para cargar pedidos asignados.');
      this.loadingPedidos = false;
      return;
    }

    this.loadingPedidos = true;
    this.errorMessage = null;
    this.pedidosSubscription = this.pedidoService.getPedidosByRepartidorId(this.repartidor._id, ['confirmado', 'en_preparacion', 'en_envio'])
      .pipe(
        tap((pedidos: IPedido[]) => {
          this.pedidosAsignados = pedidos;
          this.loadingPedidos = false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar los pedidos asignados:', error);
          this.errorMessage = `Error al cargar pedidos: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.loadingPedidos = false;
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Cambia el estado operacional del repartidor.
   * @param newStatus El nuevo estado ('disponible', 'en_entrega', 'fuera_de_servicio').
   */
  changeRepartidorStatus(newStatus: string): void {
    if (!this.repartidor?._id) {
      this.errorMessage = 'No se puede cambiar el estado: Repartidor no cargado.';
      return;
    }
    this.repartidorService.cambiarEstadoRepartidor(this.repartidor._id, newStatus)
      .pipe(
        tap(() => {
          this.repartidor!.estado = newStatus;
          this.showSuccessMessage(`Estado actualizado a: ${newStatus}`);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cambiar el estado del repartidor:', error);
          this.errorMessage = `Error al actualizar estado: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Simula la actualización de la ubicación actual del repartidor.
   * En un entorno real, esto se integraría con servicios de geolocalización.
   */
  updateLocation(): void {
    if (!this.repartidor?._id) {
      this.errorMessage = 'No se puede actualizar ubicación: Repartidor no cargado.';
      return;
    }
    const newLat = parseFloat((Math.random() * (41.90 - 41.80) + 41.80).toFixed(6));
    const newLon = parseFloat((Math.random() * (-87.60 - (-87.70)) + (-87.70)).toFixed(6));

    this.repartidorService.updateUbicacion(this.repartidor._id, newLat, newLon)
      .pipe(
        tap(() => {
          if (this.repartidor?.ubicacionActual) {
            this.repartidor.ubicacionActual.lat = newLat;
            this.repartidor.ubicacionActual.lon = newLon;
          } else {
            this.repartidor!.ubicacionActual = { lat: newLat, lon: newLon };
          }
          this.showSuccessMessage(`Ubicación actualizada a: Lat ${newLat}, Lon ${newLon}`);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar la ubicación:', error);
          this.errorMessage = `Error al actualizar ubicación: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Marca un pedido como 'en_envio' y lo asocia al repartidor.
   * @param pedidoId El ID del pedido a tomar.
   */
  takeOrder(pedidoId: string): void {
    if (!this.repartidor?._id) {
      this.errorMessage = 'No se puede tomar el pedido: Repartidor no cargado.';
      return;
    }
    this.pedidoService.updatePedido(pedidoId, {
      estado: 'en_envio',
      repartidorId: this.repartidor._id
    })
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Pedido ${pedidoId} tomado y en camino.`);
          this.loadPedidosAsignados();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al tomar el pedido:', error);
          this.errorMessage = `Error al tomar pedido: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Registra la entrega de un pedido y actualiza el historial del repartidor.
   * @param pedido El objeto Pedido a entregar.
   * @param calificacion Opcional. Calificación del cliente para la entrega.
   */
  deliverOrder(pedido: IPedido, calificacion: number | null = null): void {
    if (!this.repartidor?._id || !pedido._id) {
      this.errorMessage = 'No se puede registrar la entrega: Datos incompletos.';
      return;
    }
    const entregaData: { pedidoId: string; calificacionCliente?: number; fechaEntrega: Date } = {
      pedidoId: pedido._id,
      fechaEntrega: new Date()
    };
    if (calificacion !== null && calificacion !== undefined) {
      entregaData.calificacionCliente = calificacion;
    }
    this.repartidorService.registrarEntregaRepartidor(this.repartidor._id, entregaData)
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Pedido ${pedido._id} entregado con éxito.`);
          this.loadRepartidorData();
          this.loadPedidosAsignados();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al registrar la entrega:', error);
          this.errorMessage = `Error al registrar entrega: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  getHistorialEntregaDisplay(entrega: IHistorialEntrega): string {
    const fecha = entrega.fechaEntrega ? new Date(entrega.fechaEntrega).toLocaleDateString() : 'N/A';
    const calificacion = entrega.calificacionCliente ? `${entrega.calificacionCliente}/5 estrellas` : 'Sin calificar';
    return `Pedido ${entrega.pedidoId} - Fecha: ${fecha} - Calificación: ${calificacion}`;
  }
}