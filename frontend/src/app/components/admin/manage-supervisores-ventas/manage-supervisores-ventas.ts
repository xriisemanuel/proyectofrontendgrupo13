import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService, IUsuario } from '../../../services/usuario'; // Importa UsuarioService y la interfaz IUsuario
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-manage-supervisores-ventas',
  templateUrl: './manage-supervisores-ventas.html',
  styleUrls: ['./manage-supervisores-ventas.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Añade CommonModule y RouterLink
})
export class ManageSupervisoresVentasComponent implements OnInit, OnDestroy {
  supervisoresVentas: IUsuario[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSupervisoresVentas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de usuarios con el rol 'supervisor_ventas' desde el backend.
   */
  loadSupervisoresVentas(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        // Filtra los usuarios para mostrar solo aquellos con el rol 'supervisor_ventas'
        this.supervisoresVentas = data.filter(usuario =>
          usuario.rolId && usuario.rolId.nombre === 'supervisor_venta'
        );
        this.isLoading = false;
        console.log('Supervisores de Ventas cargados:', this.supervisoresVentas);
      },
      error: (err) => {
        console.error('Error al cargar supervisores de ventas:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de supervisores de ventas.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega al componente de edición para un supervisor de ventas específico (ahora genérico).
   * @param id El ID del usuario (supervisor de ventas) a editar.
   */
  editSupervisorVentas(id: string): void {
    this.router.navigate(['/admin/users/update', id]); // Usa la ruta genérica de actualización de usuario
  }

  /**
   * Elimina un supervisor de ventas (usuario) después de confirmación.
   * @param id El ID del usuario (supervisor de ventas) a eliminar.
   * @param username El nombre de usuario para el mensaje de confirmación.
   */
  deleteSupervisorVentas(id: string, username: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al supervisor de ventas: ${username}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.deleteUsuario(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response) => {
            this.successMessage = response.mensaje || 'Supervisor de ventas eliminado exitosamente.';
            Swal.fire('¡Eliminado!', this.successMessage, 'success');
            this.loadSupervisoresVentas(); // Recarga la lista después de la eliminación
          },
          error: (err) => {
            console.error('Error al eliminar supervisor de ventas:', err);
            this.errorMessage = err.error?.mensaje || 'Error al eliminar el supervisor de ventas.';
            Swal.fire('Error', this.errorMessage, 'error');
          }
        });
      }
    });
  }
}
