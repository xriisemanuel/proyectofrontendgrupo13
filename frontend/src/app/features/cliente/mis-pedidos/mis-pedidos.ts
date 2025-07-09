// src/app/features/cliente/components/mis-pedidos/mis-pedidos.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, LowerCasePipe } from '@angular/common'; // Importa pipes necesarios
import { Subscription } from 'rxjs';
import { PedidoService } from '../../../data/services/pedido'; // Asegúrate de que esta ruta sea correcta
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que esta ruta sea correcta
import { IPedido } from '../../../shared/interfaces'; // Asegúrate de que esta interfaz exista
import { Router, RouterLink } from '@angular/router'; // Importa Router y RouterLink

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, // Necesario para los enlaces en el HTML
    CurrencyPipe, // Para formatear moneda
    DatePipe,     // Para formatear fechas
    TitleCasePipe, // Para capitalizar el estado
    LowerCasePipe  // Para convertir el estado a minúsculas para las clases CSS
  ],
  templateUrl: './mis-pedidos.html',
  styleUrls: ['./mis-pedidos.css']
})
export class MisPedidosComponent implements OnInit, OnDestroy {
  pedidos: IPedido[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  private subscriptions: Subscription[] = [];

  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Verificar autenticación y rol
    if (!this.authService.isAuthenticated() || this.authService.getRole() !== 'cliente') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadPedidos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadPedidos(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Llama a getPedidos() sin parámetros, ya que el backend debe filtrar por el cliente autenticado
    this.subscriptions.push(
      this.pedidoService.getPedidos().subscribe({
        next: (data) => {
          this.pedidos = data;
          this.isLoading = false;
          console.log('Pedidos cargados para el cliente:', this.pedidos);
        },
        error: (err) => {
          console.error('Error al cargar mis pedidos:', err);
          this.errorMessage = 'No se pudieron cargar tus pedidos. Intenta de nuevo más tarde.';
          this.isLoading = false;
        }
      })
    );
  }

  // Helper para formatear precios (aunque CurrencyPipe ya lo hace, lo mantengo si se usa directamente)
  formatPrice(price: number): string {
    return price.toFixed(2); // Formatear a 2 decimales
  }

  // Método para navegar a los detalles de un pedido (opcional, si tienes una ruta de detalles)
  viewOrderDetails(pedidoId: string): void {
    this.router.navigate(['/client/mis-pedidos', pedidoId]); // Ejemplo de ruta
  }

  // Método para calificar un pedido (opcional, si tienes una ruta de calificación)
  rateOrder(pedidoId: string): void {
    this.router.navigate(['/client/calificar-pedido', pedidoId]); // Ejemplo de ruta
  }
}
