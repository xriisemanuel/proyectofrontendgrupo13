import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService, IUsuario } from '../../../services/usuario';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-supervisores-cocina',
  templateUrl: './manage-supervisores-cocina.html',
  styleUrls: ['./manage-supervisores-cocina.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ManageSupervisoresCocinaComponent implements OnInit, OnDestroy {
  supervisoresCocina: IUsuario[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSupervisoresCocina();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de usuarios con el rol 'supervisor_cocina' desde el backend.
   */
  loadSupervisoresCocina(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.supervisoresCocina = data.filter(usuario =>
          usuario.rolId && usuario.rolId.nombre === 'supervisor_cocina'
        );
        this.isLoading = false;
        console.log('Supervisores de Cocina cargados:', this.supervisoresCocina);
      },
      error: (err) => {
        console.error('Error al cargar supervisores de cocina:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de supervisores de cocina.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega al componente de edición para un supervisor de cocina específico (ahora genérico).
   * @param id El ID del usuario (supervisor de cocina) a editar.
   */
  editSupervisorCocina(id: string): void {
    this.router.navigate(['/admin/users/update', id]);
  }

  /**
   * Elimina un supervisor de cocina (usuario) después de confirmación.
   * @param id El ID del usuario (supervisor de cocina) a eliminar.
   * @param username El nombre de usuario para el mensaje de confirmación.
   */
  deleteSupervisorCocina(id: string, username: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al supervisor de cocina: ${username}. ¡Esta acción no se puede deshacer!`,
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
            this.successMessage = response.mensaje || 'Supervisor de cocina eliminado exitosamente.';
            Swal.fire('¡Eliminado!', this.successMessage, 'success');
            this.loadSupervisoresCocina();
          },
          error: (err) => {
            console.error('Error al eliminar supervisor de cocina:', err);
            this.errorMessage = err.error?.mensaje || 'Error al eliminar el supervisor de cocina.';
            Swal.fire('Error', this.errorMessage, 'error');
          }
        });
      }
    });
  }
}