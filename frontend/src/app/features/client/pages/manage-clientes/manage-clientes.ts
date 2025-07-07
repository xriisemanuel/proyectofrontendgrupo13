import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService, IUsuario } from '../../../../data/services/usuario'; // Usar UsuarioService
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-manage-clientes',
  templateUrl: './manage-clientes.html',
  styleUrls: ['./manage-clientes.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Añade CommonModule y RouterLink
})
export class ManageClientesComponent implements OnInit, OnDestroy {
  clientes: IUsuario[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private usuarioService: UsuarioService, // Inyectar UsuarioService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadClientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de usuarios y luego filtra los que tienen el rol 'cliente'.
   */
  loadClientes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({ // Usar getUsuarios()
      next: (data) => {
        // Filtra los usuarios para mostrar solo aquellos con el rol 'cliente'
        this.clientes = data.filter(usuario =>
          usuario.rolId && usuario.rolId.nombre === 'cliente'
        );
        this.isLoading = false;
        console.log('Clientes cargados:', this.clientes);
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de clientes.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega al componente de edición genérico para un cliente específico.
   * @param id El ID del usuario (cliente) a editar.
   */
  editCliente(id: string): void {
    this.router.navigate(['/admin/users/update', id]); // Usa la ruta genérica de actualización de usuario
  }

  /**
   * Elimina un cliente (usuario) después de confirmación.
   * @param id El ID del usuario (cliente) a eliminar.
   * @param username El nombre de usuario para el mensaje de confirmación.
   */
  deleteCliente(id: string, username: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al cliente: ${username}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.deleteUsuario(id).pipe(takeUntil(this.destroy$)).subscribe({ // Usar deleteUsuario()
          next: (response) => {
            this.successMessage = response.mensaje || 'Cliente eliminado exitosamente.';
            Swal.fire('¡Eliminado!', this.successMessage, 'success');
            this.loadClientes(); // Recarga la lista después de la eliminación
          },
          error: (err) => {
            console.error('Error al eliminar cliente:', err);
            this.errorMessage = err.error?.mensaje || 'Error al eliminar el cliente.';
            Swal.fire('Error', this.errorMessage, 'error');
          }
        });
      }
    });
  }
}
