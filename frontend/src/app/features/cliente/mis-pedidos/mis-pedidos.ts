// src/app/features/cliente/components/mis-pedidos/mis-pedidos.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PedidoService } from '../../../data/services/pedido'; // Asegúrate de que esta ruta sea correcta
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que esta ruta sea correcta
import { IPedido } from '../../../shared/interfaces'; // Asegúrate de que esta interfaz exista
import { Router } from '@angular/router'; // Importa Router

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule],
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

    // Obtener el ID del cliente logueado (asumiendo que está disponible en el token o perfil de usuario)
    // Para este ejemplo, asumiremos que el backend filtra por el clienteId asociado al usuario autenticado.
    // Si tu PedidoService.getPedidos necesita el clienteId explícitamente desde el frontend,
    // deberías obtenerlo del currentUser o de un servicio de cliente.
    this.subscriptions.push(
      this.pedidoService.getPedidos().subscribe({ // El backend debería filtrar por el cliente autenticado
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

  // Helper para formatear precios
  formatPrice(price: number): string {
    return price.toFixed(2); // Formatear a 2 decimales
  }
}
