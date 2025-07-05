import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService, IUsuario } from '../../../services/usuario'; // Usar UsuarioService
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-manage-repartidores',
  templateUrl: './manage-repartidores.html',
  styleUrls: ['./manage-repartidores.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Añade CommonModule y RouterLink
})
export class ManageRepartidoresComponent implements OnInit, OnDestroy {
  repartidores: IUsuario[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private usuarioService: UsuarioService, // Inyectar UsuarioService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRepartidores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de usuarios y luego filtra los que tienen el rol 'repartidor'.
   */
  loadRepartidores(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({ // Usar getUsuarios()
      next: (data) => {
        // Filtra los usuarios para mostrar solo aquellos con el rol 'repartidor'
        this.repartidores = data.filter(usuario =>
          usuario.rolId && usuario.rolId.nombre === 'repartidor'
        );
        this.isLoading = false;
        console.log('Repartidores cargados:', this.repartidores);
      },
      error: (err) => {
        console.error('Error al cargar repartidores:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de repartidores.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega al componente de edición genérico para un repartidor específico.
   * @param id El ID del usuario (repartidor) a editar.
   */
  editRepartidor(id: string): void {
    this.router.navigate(['/admin/users/update', id]); // Usa la ruta genérica de actualización de usuario
  }

  /**
   * Elimina un repartidor (usuario) después de confirmación.
   * @param id El ID del usuario (repartidor) a eliminar.
   * @param username El nombre de usuario para el mensaje de confirmación.
   */
  deleteRepartidor(id: string, username: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al repartidor: ${username}. ¡Esta acción no se puede deshacer!`,
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
            this.successMessage = response.mensaje || 'Repartidor eliminado exitosamente.';
            Swal.fire('¡Eliminado!', this.successMessage, 'success');
            this.loadRepartidores(); // Recarga la lista después de la eliminación
          },
          error: (err) => {
            console.error('Error al eliminar repartidor:', err);
            this.errorMessage = err.error?.mensaje || 'Error al eliminar el repartidor.';
            Swal.fire('Error', this.errorMessage, 'error');
          }
        });
      }
    });
  }
}
