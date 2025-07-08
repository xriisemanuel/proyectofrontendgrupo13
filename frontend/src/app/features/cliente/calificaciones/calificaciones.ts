// src/app/features/cliente/components/calificaciones/calificaciones.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CalificacionService } from '../../../data/services/calificacion.service'; // Ruta corregida
import { PedidoService } from '../../../data/services/pedido'; // Ruta corregida
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida
import { ICalificacion, IPedido, ICalificacionProducto } from '../../../shared/interfaces'; // Importa ICalificacionProducto también
import { Router } from '@angular/router';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calificaciones.html',
  styleUrls: ['./calificaciones.css']
})
export class CalificacionesComponent implements OnInit, OnDestroy {
  calificaciones: ICalificacion[] = [];
  pedidosCompletados: IPedido[] = []; // Pedidos que el cliente puede calificar
  selectedPedidoId: string | null = null;

  // Propiedades para las tres puntuaciones separadas
  puntuacionComida: number = 0;
  puntuacionServicio: number = 0;
  puntuacionEntrega: number = 0;

  comentario: string = '';

  isLoading: boolean = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private subscriptions: Subscription[] = [];

  private calificacionService = inject(CalificacionService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.getRole() !== 'cliente') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCalificacionesAndPedidos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCalificacionesAndPedidos(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Cargar calificaciones existentes del cliente
    this.subscriptions.push(
      this.calificacionService.getCalificaciones().subscribe({ // Asumiendo que el backend filtra por cliente autenticado
        next: (data) => {
          this.calificaciones = data;
          console.log('Calificaciones cargadas:', this.calificaciones);
          this.loadPedidosCompletados(); // Cargar pedidos completados después de las calificaciones
        },
        error: (err) => {
          console.error('Error al cargar calificaciones:', err);
          this.errorMessage = 'No se pudieron cargar tus calificaciones. Intenta de nuevo.';
          this.isLoading = false; // Detener carga si hay error aquí
        }
      })
    );
  }

  loadPedidosCompletados(): void {
    // Cargar pedidos con estado "entregado" que aún no han sido calificados por este cliente
    this.subscriptions.push(
      this.pedidoService.getPedidos(['entregado']).subscribe({ // Asumiendo que el backend filtra por cliente autenticado
        next: (data) => {
          // Filtrar pedidos que ya tienen una calificación
          const pedidosCalificadosIds = new Set(this.calificaciones.map(c => c.pedidoId));
          // CORRECCIÓN: Se añade una verificación para asegurar que pedido._id exista
          this.pedidosCompletados = data.filter(pedido => pedido._id && !pedidosCalificadosIds.has(pedido._id));
          this.isLoading = false;
          console.log('Pedidos completados disponibles para calificar:', this.pedidosCompletados);
        },
        error: (err) => {
          console.error('Error al cargar pedidos completados:', err);
          this.errorMessage = 'No se pudieron cargar los pedidos para calificar. Intenta de nuevo.';
          this.isLoading = false;
        }
      })
    );
  }

  submitCalificacion(): void {
    this.errorMessage = null;
    this.successMessage = null;
    if (!this.selectedPedidoId || this.puntuacionComida === 0 || this.puntuacionServicio === 0 || this.puntuacionEntrega === 0) {
      this.errorMessage = 'Por favor, selecciona un pedido y asigna una puntuación para Comida, Servicio y Entrega.';
      return;
    }

    const newCalificacion: Partial<ICalificacion> = {
      pedidoId: this.selectedPedidoId,
      // Se envían las tres puntuaciones separadas
      puntuacionComida: this.puntuacionComida,
      puntuacionServicio: this.puntuacionServicio,
      puntuacionEntrega: this.puntuacionEntrega,
      comentario: this.comentario.trim() || undefined,
      // clienteId se debería obtener del token en el backend
      // calificacionProductos: [] // Si no hay calificaciones de productos específicas, puedes dejarlo vacío o no enviarlo
    };

    this.subscriptions.push(
      this.calificacionService.createCalificacion(newCalificacion).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Calificación enviada con éxito!';
          console.log('Calificación enviada:', response);
          this.resetForm();
          this.loadCalificacionesAndPedidos(); // Recargar datos para actualizar listas
        },
        error: (err) => {
          console.error('Error al enviar calificación:', err);
          this.errorMessage = err.error?.mensaje || 'Error al enviar tu calificación. Intenta de nuevo.';
        }
      })
    );
  }

  /**
   * Establece la puntuación para la categoría de Comida.
   * NOTA: Tu HTML actual solo tiene un conjunto de estrellas.
   * Deberás modificar 'calificaciones.html' para tener controles de estrellas separados
   * para 'puntuacionServicio' y 'puntuacionEntrega', y sus respectivos métodos.
   * @param star El número de estrellas seleccionadas.
   */
  setRating(star: number, type: 'comida' | 'servicio' | 'entrega'): void {
    if (type === 'comida') {
      this.puntuacionComida = star;
    } else if (type === 'servicio') {
      this.puntuacionServicio = star;
    } else if (type === 'entrega') {
      this.puntuacionEntrega = star;
    }
  }

  resetForm(): void {
    this.selectedPedidoId = null;
    this.puntuacionComida = 0;
    this.puntuacionServicio = 0;
    this.puntuacionEntrega = 0;
    this.comentario = '';
  }
}
