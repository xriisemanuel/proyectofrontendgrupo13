// src/app/features/admin/manage-roles/manage-roles.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// --- ¡IMPORTACIÓN CORRECTA Y ÚNICA DE INTERFACES! ---
import { UsuarioService } from '../../../data/services/usuario';
import { IRol, IUsuario } from '../../../shared/interfaces';
// --- FIN DE IMPORTACIÓN ---

@Component({
  selector: 'app-manage-roles',
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-roles.html',
  styleUrls: ['./manage-roles.css'],
  standalone: true,
})
export class ManageRoles implements OnInit, OnDestroy {
  roles: IRol[] = [];
  adminUsers: IUsuario[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoadingRoles: boolean = true;
  isLoadingAdminUsers: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
    this.loadAdminUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.isLoadingRoles = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: IRol[]) => {
        this.roles = data;
        this.isLoadingRoles = false;
        console.log('Roles cargados desde el backend:', this.roles);
      },
      error: (err) => {
        console.error('Error al cargar los roles:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los roles desde el servidor.';
        this.toastr.error(this.errorMessage, 'Error de Carga');
        this.isLoadingRoles = false;
      }
    });
  }

  loadAdminUsers(): void {
    this.isLoadingAdminUsers = true;
    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: IUsuario[]) => {
        console.log('DEBUG: Todos los usuarios recibidos del backend:', data);
        this.adminUsers = data.filter(user => {
          console.log('DEBUG: Procesando usuario:', user.username);
          console.log('DEBUG: Valor de user.rolId:', user.rolId);
          if (user.rolId && typeof user.rolId === 'object' && 'nombre' in user.rolId) {
            const roleName = (user.rolId as IRol).nombre;
            console.log('DEBUG: Nombre del rol extraído:', roleName);
            console.log('DEBUG: Comparando:', roleName?.toLowerCase(), 'con "admin"');
            return roleName?.toLowerCase() === 'admin';
          }
          console.log('DEBUG: user.rolId no es un objeto con nombre o es nulo/indefinido.');
          return false;
        });
        this.isLoadingAdminUsers = false;
        console.log('DEBUG: Usuarios administradores cargados (después de filtro):', this.adminUsers);
      },
      error: (err) => {
        console.error('Error al cargar usuarios administradores:', err);
        this.toastr.error('Error al cargar la lista de administradores.', 'Error de Carga');
        this.isLoadingAdminUsers = false;
      }
    });
  }

  getRoleName(user: IUsuario): string {
    return (user.rolId && typeof user.rolId === 'object' && 'nombre' in user.rolId) ? (user.rolId as IRol).nombre : 'Desconocido';
  }

  editRole(roleId: string): void {
    console.log('Navegando para editar rol con ID:', roleId);
    this.router.navigate(['/admin/roles/edit', roleId]);
  }

  deleteRole(roleId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.')) {
      this.usuarioService.deleteRol(roleId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Rol eliminado exitosamente!', 'Eliminado');
          console.log('Rol eliminado:', response);
          this.loadRoles();
          this.loadAdminUsers();
        },
        error: (err) => {
          console.error('Error al eliminar el rol:', err);
          this.toastr.error(err.error?.mensaje || 'Error al eliminar el rol. Asegúrese de que no esté en uso.', 'Error');
        }
      });
    }
  }

  editUser(userId: string): void {
    this.toastr.info(`Funcionalidad de edición para el usuario ${userId} (por implementar).`);
    this.router.navigate(['/admin/users/edit', userId]);
  }

  deleteUser(userId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Usuario eliminado exitosamente.', 'Eliminado');
          this.loadAdminUsers();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          this.toastr.error(err.error?.mensaje || 'Error al eliminar usuario.', 'Error');
        }
      });
    }
  }
}