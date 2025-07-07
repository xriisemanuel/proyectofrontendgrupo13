// src/app/components/pedido-dashboard/pedido-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for *ngIf, *ngFor, pipes
import { FormsModule } from '@angular/forms';   // Needed for ngModel (filters)
import { RouterLink } from '@angular/router';   // Needed for routerLink directive if used

// Ensure these import paths are CORRECT for your project structure
import { PedidoService, IPedido, IDetalleProducto, IClientePopulated, IRepartidorPopulated } from '../../services/pedido';
import { AuthService } from '../../services/auth';
import { RepartidorService, IRepartidor } from '../../services/repartidor'; // To get list of repartidores for filter

import { catchError, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-pedido-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './pedido-dashboard.html',
  styleUrls: ['./pedido-dashboard.css']
})
export class PedidoDashboard implements OnInit, OnDestroy {

  pedidos: IPedido[] = [];
  repartidores: IRepartidor[] = []; // List of repartidores for the filter dropdown
  loading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Filter properties
  selectedEstado: string = ''; // Empty string means "all states" initially
  selectedRepartidorId: string = ''; // Empty string means "all repartidores"
  selectedClienteId: string = ''; // For filtering by client (if implemented in backend)
  fechaDesde: string = ''; // Date filter start
  fechaHasta: string = ''; // Date filter end

  // Search functionality
  searchTerm: string = '';
  private searchSubject = new Subject<string>(); // Subject for debounce search

  private pedidosSubscription: Subscription | undefined;
  private repartidoresSubscription: Subscription | undefined;

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService,
    private repartidorService: RepartidorService
  ) { }

  ngOnInit(): void {
    this.loadPedidos();
    this.loadRepartidoresForFilter(); // Load repartidores for the filter dropdown

    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(400), // Wait for 400ms after the last keystroke
      distinctUntilChanged(), // Only emit if value is different from previous value
      tap(() => this.loadPedidos()) // Trigger order load
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.pedidosSubscription?.unsubscribe();
    this.repartidoresSubscription?.unsubscribe();
    this.searchSubject.unsubscribe();
  }

  /**
   * Loads orders based on current filter and search criteria.
   * This method will call the backend's `listarPedidos` endpoint, which now supports
   * filtering by `repartidorId`, `estados`, and potentially other query parameters
   * like `clienteId`, `fechaDesde`, `fechaHasta`.
   */
  loadPedidos(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null; // Clear success messages on new load

    // Prepare query parameters for the backend
    const estados = this.selectedEstado ? [this.selectedEstado] : []; // If a state is selected, send it as an array
    const repartidorId = this.selectedRepartidorId || undefined; // Send undefined if no repartidor selected
    const clienteId = this.selectedClienteId || undefined; // Send undefined if no client selected
    const fechaDesde = this.fechaDesde || undefined;
    const fechaHasta = this.fechaHasta || undefined;
    const searchTerm = this.searchTerm || undefined; // If your backend supports searching by term

    this.pedidosSubscription = this.pedidoService.getPedidos(
      estados,
      repartidorId,
      clienteId,
      fechaDesde,
      fechaHasta,
      searchTerm // Pass the search term
    )
      .pipe(
        tap(data => {
          this.pedidos = data;
          this.loading = false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar los pedidos:', error);
          this.errorMessage = `Error al cargar pedidos: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.loading = false;
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Loads the list of repartidores to populate the filter dropdown.
   */
  loadRepartidoresForFilter(): void {
    this.repartidoresSubscription = this.repartidorService.getRepartidores()
      .pipe(
        tap(data => {
          this.repartidores = data;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar repartidores para el filtro:', error);
          // Don't set errorMessage for main pedidos, but log it
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Handles changes in the search input field.
   * Uses a Subject to debounce the input and trigger `loadPedidos`.
   * @param event The input event.
   */
  onSearchInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Changes the status of a specific order.
   * @param pedidoId The ID of the order to update.
   * @param newStatus The new status for the order.
   */
  changeOrderStatus(pedidoId: string, newStatus: IPedido['estado']): void {
    this.pedidoService.updateEstadoPedido(pedidoId, newStatus)
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Estado del pedido ${pedidoId} actualizado a ${newStatus}`);
          this.loadPedidos(); // Reload orders to reflect the change
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar estado del pedido:', error);
          this.errorMessage = `Error al actualizar estado: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Assigns a repartidor to an order.
   * This requires a specific endpoint in your backend and PedidoService.
   * @param pedidoId The ID of the order.
   * @param repartidorId The ID of the repartidor to assign.
   */
  assignRepartidor(pedidoId: string, event: Event): void { // <-- ¡Firma del método ajustada!
    const selectElement = event.target as HTMLSelectElement;
    const repartidorId = selectElement.value; // Extraemos el valor de forma segura aquí

    if (!repartidorId) {
      // Si se selecciona la opción "Asignar Repartidor" (vacía) o se intenta desasignar
      console.log(`Intentando desasignar/cancelar asignación para pedido ${pedidoId}`);
      // Llama a un método en el servicio para desasignar (ej. updatePedido con repartidorId: null)
      this.pedidoService.updatePedido(pedidoId, { repartidorId: null })
        .pipe(
          tap(() => {
            this.showSuccessMessage(`Repartidor desasignado del pedido ${pedidoId}.`);
            this.loadPedidos();
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error al desasignar repartidor:', error);
            this.errorMessage = `Error al desasignar repartidor: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
            return of(null);
          })
        )
        .subscribe();
      return;
    }

    // Si se seleccionó un repartidor válido, procedemos a asignar
    const fechaEstimadaEntrega = new Date();
    fechaEstimadaEntrega.setHours(fechaEstimadaEntrega.getHours() + 1);

    this.pedidoService.asignarRepartidor(pedidoId, repartidorId, fechaEstimadaEntrega)
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Repartidor asignado al pedido ${pedidoId}`);
          this.loadPedidos();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al asignar repartidor:', error);
          this.errorMessage = `Error al asignar repartidor: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }
    
    onReassignClick(pedidoId: string): void {
    // Creamos un objeto Event simulado con un target.value vacío
    const simulatedEvent = { target: { value: '' } } as unknown as Event;
    this.assignRepartidor(pedidoId, simulatedEvent);
  }

  /**
   * Deletes an order.
   * @param pedidoId The ID of the order to delete.
   */
  deleteOrder(pedidoId: string): void {
    if (!confirm('¿Está seguro de que desea eliminar este pedido? Esta acción es irreversible.')) {
      return;
    }
    this.pedidoService.deletePedido(pedidoId)
      .pipe(
        tap(() => {
          this.showSuccessMessage(`Pedido ${pedidoId} eliminado exitosamente.`);
          this.loadPedidos(); // Reload orders
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al eliminar pedido:', error);
          this.errorMessage = `Error al eliminar pedido: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Navigates to the order detail page (if you have one).
   * You might need to inject `Router` and use `this.router.navigate(['/pedidos', pedidoId])`.
   * @param pedidoId The ID of the order to view details.
   */
  viewOrderDetails(pedidoId: string): void {
    // Implement navigation to a detail page if you create one
    // Example: this.router.navigate(['/pedidos', pedidoId]);
    alert(`Ver detalles del pedido: ${pedidoId}`); // Placeholder
  }

  /**
   * Displays a temporary success message in the UI.
   * @param message The success message to display.
   */
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000); // Message disappears after 3 seconds
  }

  /**
   * Helper to get the full name of a client from the populated object.
   * @param clienteId The populated client object.
   * @returns Client's full name or 'N/A'.
   */
  getClienteNombre(clienteId: IClientePopulated): string {
    return clienteId?.usuarioId?.nombre && clienteId?.usuarioId?.apellido
      ? `${clienteId.usuarioId.nombre} ${clienteId.usuarioId.apellido}`
      : 'N/A';
  }

  /**
   * Helper to get the full name of a repartidor from the populated object.
   * @param repartidor The populated repartidor object (can be string or object).
   * @returns Repartidor's full name or 'N/A'.
   */
  getRepartidorNombre(repartidor: string | IRepartidorPopulated | null | undefined): string {
    if (typeof repartidor === 'object' && repartidor !== null) {
      return repartidor.nombre && repartidor.apellido
        ? `${repartidor.nombre} ${repartidor.apellido}`
        : repartidor.nombre || 'N/A';
    }
    return 'No Asignado';
  }
}
