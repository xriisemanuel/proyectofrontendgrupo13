// src/app/features/cliente/components/calificaciones/calificaciones.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CalificacionService } from '../../../data/services/calificacion.service'; // Ruta corregida
import { PedidoService } from '../../../data/services/pedido'; // Ruta corregida
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida
import { ICalificacion, IPedido, ICalificacionProducto, IPedidoPopulado } from '../../../shared/interfaces'; // Importa ICalificacionProducto también
import { Router, ActivatedRoute } from '@angular/router';

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
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.getRole() !== 'cliente') {
      this.router.navigate(['/login']);
      return;
    }
    
    // Verificar si hay un pedidoId en los query params
    this.route.queryParams.subscribe(params => {
      const pedidoId = params['pedidoId'];
      if (pedidoId) {
        this.selectedPedidoId = pedidoId;
        console.log('Pedido seleccionado desde query params:', pedidoId);
      }
    });
    
    this.loadCalificacionesAndPedidos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCalificacionesAndPedidos(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    console.log('DEBUG - Iniciando carga de calificaciones y pedidos');
    console.log('DEBUG - Token disponible:', !!this.authService.getToken());
    console.log('DEBUG - Rol del usuario:', this.authService.getRole());

    // Cargar calificaciones existentes del cliente
    this.subscriptions.push(
      this.calificacionService.getCalificaciones().subscribe({ // Asumiendo que el backend filtra por cliente autenticado
        next: (data) => {
          this.calificaciones = data;
          console.log('DEBUG - Calificaciones cargadas exitosamente:', this.calificaciones.length);
          console.log('DEBUG - Primera calificación:', this.calificaciones[0]);
          if (this.calificaciones.length > 0) {
            console.log('DEBUG - Puntuación comida:', this.calificaciones[0].puntuacionComida);
            console.log('DEBUG - Puntuación servicio:', this.calificaciones[0].puntuacionServicio);
            console.log('DEBUG - Puntuación entrega:', this.calificaciones[0].puntuacionEntrega);
            console.log('DEBUG - Tipo de puntuación comida:', typeof this.calificaciones[0].puntuacionComida);
            console.log('DEBUG - Puntuación comida válida:', this.getPuntuacionValida(this.calificaciones[0].puntuacionComida));
          }
          this.loadPedidosCompletados(); // Cargar pedidos completados después de las calificaciones
        },
        error: (err) => {
          console.error('DEBUG - Error al cargar calificaciones:', err);
          console.error('DEBUG - Status:', err.status);
          console.error('DEBUG - Error message:', err.error);
          this.errorMessage = 'No se pudieron cargar tus calificaciones. Intenta de nuevo.';
          this.isLoading = false; // Detener carga si hay error aquí
        }
      })
    );
  }

  loadPedidosCompletados(): void {
    console.log('DEBUG - Iniciando carga de pedidos completados');
    
    // Cargar pedidos con estado "entregado" que aún no han sido calificados por este cliente
    this.subscriptions.push(
      this.pedidoService.getPedidos(['entregado']).subscribe({ // Asumiendo que el backend filtra por cliente autenticado
        next: (data) => {
          console.log('DEBUG - Pedidos recibidos del backend:', data.length);
          console.log('DEBUG - Primer pedido:', data[0]);
          
          // Filtrar pedidos que ya tienen una calificación
          const pedidosCalificadosIds = new Set(this.calificaciones.map(c => c.pedidoId));
          console.log('DEBUG - IDs de pedidos ya calificados:', Array.from(pedidosCalificadosIds));
          
          // CORRECCIÓN: Se añade una verificación para asegurar que pedido._id exista
          this.pedidosCompletados = data.filter(pedido => pedido._id && !pedidosCalificadosIds.has(pedido._id));
          this.isLoading = false;
          console.log('DEBUG - Pedidos completados disponibles para calificar:', this.pedidosCompletados.length);
        },
        error: (err) => {
          console.error('DEBUG - Error al cargar pedidos completados:', err);
          console.error('DEBUG - Status:', err.status);
          console.error('DEBUG - Error message:', err.error);
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

  /**
   * Obtiene el ID del pedido de una calificación, manejando tanto string como objeto populado
   * @param pedidoId El pedidoId que puede ser string o IPedidoPopulado
   * @returns El ID del pedido como string
   */
  getPedidoId(pedidoId: string | IPedidoPopulado): string {
    if (typeof pedidoId === 'string') {
      return pedidoId;
    } else {
      return pedidoId._id;
    }
  }

  /**
   * Verifica si una puntuación es válida para mostrar las estrellas
   * @param puntuacion La puntuación a verificar
   * @returns La puntuación si es válida, 0 si no
   */
  getPuntuacionValida(puntuacion: number | undefined | null): number {
    console.log('DEBUG - getPuntuacionValida input:', puntuacion, 'type:', typeof puntuacion);
    if (puntuacion !== undefined && puntuacion !== null && puntuacion >= 0 && puntuacion <= 5) {
      console.log('DEBUG - getPuntuacionValida returning:', puntuacion);
      return puntuacion;
    }
    console.log('DEBUG - getPuntuacionValida returning: 0');
    return 0;
  }

  /**
   * Elimina una calificación específica
   * @param calificacionId El ID de la calificación a eliminar
   */
  deleteCalificacion(calificacionId: string): void {
    if (!calificacionId) {
      this.errorMessage = 'ID de calificación no válido.';
      return;
    }

    // Confirmar antes de eliminar
    if (!confirm('¿Estás seguro de que quieres eliminar esta calificación? Esta acción no se puede deshacer.')) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;

    this.subscriptions.push(
      this.calificacionService.deleteCalificacion(calificacionId).subscribe({
        next: (response) => {
          this.successMessage = 'Calificación eliminada exitosamente.';
          console.log('Calificación eliminada:', response);
          this.loadCalificacionesAndPedidos(); // Recargar datos
        },
        error: (err) => {
          console.error('Error al eliminar calificación:', err);
          this.errorMessage = err.error?.mensaje || 'Error al eliminar la calificación. Intenta de nuevo.';
        }
      })
    );
  }

  /**
   * Navega de vuelta a la página anterior
   */
  goBack(): void {
    // Intentar navegar al historial anterior, si no hay historial, ir al dashboard del cliente
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/client-dashboard']);
    }
  }
}
