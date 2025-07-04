import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClienteService, ICliente } from '../../../services/cliente'; // Importa el servicio y la interfaz
import { CommonModule } from '@angular/common'; // Para directivas como ngFor, ngIf
import { Router, RouterLink } from '@angular/router'; // Para navegación programática
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-manage-clientes',
  imports: [CommonModule, RouterLink], // RouterLink para el botón de volver y editar
  templateUrl: './manage-clientes.html',
  styleUrl: './manage-clientes.css'
})

export class ManageClientes implements OnInit, OnDestroy {
  clientes: ICliente[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadClientes(); // Carga los clientes al inicializar el componente
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de clientes desde el servicio.
   */
  loadClientes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clienteService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        // Filtra los clientes que tienen un usuario asociado y si el rol del usuario es 'cliente'
        // Esto es una capa extra de seguridad si la API no filtra por rol
        this.clientes = data.filter(cliente =>
          cliente.usuarioId && cliente.usuarioId.rolId && cliente.usuarioId.rolId.nombre === 'cliente'
        );
        console.log('Clientes cargados:', this.clientes);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de clientes.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la página de edición de un cliente.
   * @param clienteId El ID del perfil de cliente a editar.
   */
  editCliente(clienteId: string | undefined): void {
    if (clienteId) {
      this.router.navigate(['/admin/clientes/update', clienteId]);
    } else {
      console.warn('ID de cliente no proporcionado para edición.');
      Swal.fire('Advertencia', 'No se pudo obtener el ID del cliente para la edición.', 'warning');
    }
  }

  /**
   * Elimina un cliente después de una confirmación.
   * @param clienteId El ID del perfil de cliente a eliminar.
   * @param username El nombre de usuario asociado para el mensaje de confirmación.
   */
  deleteCliente(clienteId: string | undefined, username: string | undefined): void {
    if (!clienteId) {
      console.warn('ID de cliente no proporcionado para eliminación.');
      Swal.fire('Advertencia', 'No se pudo obtener el ID del cliente para la eliminación.', 'warning');
      return;
    }

    Swal.fire({
      title: `¿Estás seguro de eliminar al cliente ${username}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(clienteId).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response) => {
            Swal.fire('¡Eliminado!', response.mensaje || 'El cliente ha sido eliminado.', 'success');
            this.loadClientes(); // Recarga la lista para reflejar los cambios
          },
          error: (err) => {
            console.error('Error al eliminar cliente:', err);
            Swal.fire('Error', err.error?.mensaje || 'Error al eliminar el cliente.', 'error');
          }
        });
      }
    });
  }
}
