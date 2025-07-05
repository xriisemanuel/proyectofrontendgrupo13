// src/app/components/supervisor/kitchen/kitchen-dashboard/kitchen-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel si lo usamos en filtros
import { PedidoService, IPedido, IDetalleProducto, IClientePopulated } from '../../services/pedido'; // Asegúrate de que la ruta sea correcta
import Swal from 'sweetalert2'; // Para las notificaciones amigables

// RouterLink es para la navegación declarativa en el HTML (si lo necesitamos, por ejemplo, para ir a detalles de un pedido)
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kitchen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // Importa FormsModule para ngModel si lo usas, RouterLink para enlaces
  templateUrl: './kitchen-dashboard.html',
  styleUrls: ['./kitchen-dashboard.css']
})
export class KitchenDashboard implements OnInit {
  pedidos: IPedido[] = [];
  filteredPedidos: IPedido[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Estados relevantes para el supervisor de cocina
  // Estos son los estados que el supervisor de cocina puede ver y gestionar
  kitchenRelevantStates: IPedido['estado'][] = [
    'pendiente',
    'confirmado',
    'en_preparacion',
    'en_envio' // Incluimos 'en_envio' para que la cocina sepa qué salió y no duplicar trabajo, aunque no lo gestionen activamente.
  ];

  // Opciones de estado para cambiar un pedido (según los permisos en el backend)
  // El supervisor de cocina puede cambiar a estos estados:
  kitchenActionableStates: IPedido['estado'][] = [
    'confirmado',
    'en_preparacion',
    'en_envio',
    'cancelado'
  ];

  // Filtros
  selectedFilterState: IPedido['estado'] | '' = ''; // Para filtrar por un estado específico
  searchTerm: string = ''; // Para buscar por ID de pedido o nombre de cliente/producto
Object: any;

  constructor(private pedidoService: PedidoService) { }

  ngOnInit(): void {
    this.loadPedidos();
  }

  loadPedidos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Llama al servicio para obtener todos los pedidos, o los relevantes para cocina
    // Podríamos usar getPedidosByEstado() si queremos filtrar solo un estado,
    // o getPedidos() y luego filtrar en el frontend si queremos varios.
    // Para el dashboard de cocina, es común ver 'pendientes', 'confirmados', 'en_preparacion'.
    // Usaremos getPedidos con el array de estados para que el backend filtre si soporta CSV o múltiples queries.
    // Si tu backend getPedidosFiltrados soporta 'estado=estado1,estado2', esto es ideal.
    // Si solo soporta un estado por vez, necesitaríamos varias llamadas o un ajuste en el backend.
    // Asumiré que getPedidosFiltrados con query param 'estado' puede manejar un solo estado o múltiples si se unen por coma.
    // Una forma de hacer esto es que el backend reciba 'estados' como un array de query params: ?estado=s1&estado=s2
    // Pero el controlador actual usa `estado` directamente como string.
    // Por lo tanto, la mejor estrategia es:
    // 1. Obtener todos los pedidos permitidos para este rol (`listarPedidos` sin filtros)
    // 2. Filtrar en el frontend por `kitchenRelevantStates`.

    this.pedidoService.getPedidos().subscribe({
      next: (data) => {
        // Filtramos solo los pedidos que son relevantes para la cocina
        this.pedidos = data.filter(pedido => this.kitchenRelevantStates.includes(pedido.estado));
        this.applyFilters(); // Aplica filtros iniciales (si hay alguno seleccionado por defecto o vacío)
        console.log('Pedidos cargados para cocina:', this.pedidos);
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los pedidos.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let tempPedidos = [...this.pedidos];

    // Filtrar por estado seleccionado
    if (this.selectedFilterState) {
      tempPedidos = tempPedidos.filter(pedido => pedido.estado === this.selectedFilterState);
    }

    // Filtrar por término de búsqueda (ID de pedido, nombre de cliente o nombre de producto)
    if (this.searchTerm.trim()) {
      const lowerCaseSearchTerm = this.searchTerm.trim().toLowerCase();
      tempPedidos = tempPedidos.filter(pedido =>
        // Buscar en ID de pedido
        pedido._id?.toLowerCase().includes(lowerCaseSearchTerm) ||
        // Buscar en nombre de cliente (si está populado)
        (typeof pedido.clienteId !== 'string' && pedido.clienteId?.nombre?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        // Buscar en productos del detalle
        pedido.detalleProductos.some(item => item.nombreProducto.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    this.filteredPedidos = tempPedidos;
  }

  // Permite obtener el nombre del cliente cuando clienteId está populado
  getClienteNombre(clienteId: string | IClientePopulated | undefined): string {
    if (typeof clienteId === 'object' && clienteId !== null && 'nombre' in clienteId) {
      return `${clienteId.nombre} ${clienteId.apellido || ''}`.trim();
    }
    return 'Cliente Desconocido';
  }


  async updatePedidoEstado(pedidoId: string | undefined, currentStatus: IPedido['estado']): Promise<void> {
    if (!pedidoId) {
      Swal.fire('Error', 'ID de pedido no disponible.', 'error');
      return;
    }

    const { value: nuevoEstado } = await Swal.fire({
      title: 'Cambiar estado del pedido',
      input: 'select',
      inputOptions: this.getAvailableNextStates(currentStatus), // Obtiene estados válidos para cambiar
      inputPlaceholder: 'Selecciona un nuevo estado',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value) {
            resolve('');
          } else {
            resolve('Necesitas seleccionar un estado');
          }
        });
      }
    });

    if (nuevoEstado) {
      this.isLoading = true;
      this.pedidoService.updateEstadoPedido(pedidoId, nuevoEstado as IPedido['estado']).subscribe({
        next: (res) => {
          this.successMessage = res.mensaje || 'Estado del pedido actualizado exitosamente.';
          Swal.fire('Éxito', this.successMessage, 'success');
          this.loadPedidos(); // Recarga la lista para reflejar el cambio
        },
        error: (err) => {
          console.error('Error al actualizar estado del pedido:', err);
          this.errorMessage = err.error?.mensaje || 'Error al actualizar el estado del pedido.';
          Swal.fire('Error', this.errorMessage, 'error');
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  // Lógica para determinar los estados a los que se puede cambiar desde el estado actual
  getAvailableNextStates(currentStatus: IPedido['estado']): { [key: string]: string } {
    const statesMap: { [key: string]: string } = {};

    // Mapeo de estados del backend a un formato amigable para el usuario
    const friendlyStates: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'en_preparacion': 'En Preparación',
      'en_envio': 'En Envío',
      'listo_para_entrega': 'Listo para Entrega',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };

    let possibleNextStates: IPedido['estado'][] = [];

    // Esta lógica debe reflejar los permisos del controlador de backend para 'supervisor_cocina'
    switch (currentStatus) {
      case 'pendiente':
        possibleNextStates = ['confirmado', 'cancelado'];
        break;
      case 'confirmado':
        possibleNextStates = ['en_preparacion', 'cancelado'];
        break;
      case 'en_preparacion':
        possibleNextStates = ['en_envio', 'cancelado'];
        break;
      // Una vez que está "en_envio", la cocina no debería cambiarlo
      // a estados de preparación. Solo a cancelado.
      case 'en_envio':
        possibleNextStates = ['cancelado']; // Solo puede cancelar o dejar que repartidor lo maneje
        break;
      default:
        // No permitir cambios desde 'entregado' o 'cancelado' por supervisor de cocina
        possibleNextStates = [];
        break;
    }

    // Filtra los estados que el supervisor de cocina tiene permiso para modificar
    possibleNextStates = possibleNextStates.filter(state => this.kitchenActionableStates.includes(state));


    // Construye el objeto para SweetAlert2
    possibleNextStates.forEach(state => {
      statesMap[state] = friendlyStates[state] || state;
    });

    return statesMap;
  }
}