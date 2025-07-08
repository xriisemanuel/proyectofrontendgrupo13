// src/app/features/admin/manage-users-by-rol/manage-users-by-rol.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// --- ¡IMPORTACIÓN CORRECTA Y ÚNICA DE INTERFACES! ---
import { IUsuario, IRol } from '../../../shared/interfaces';
// --- Importa los servicios ---
import { UsuarioService } from '../../../data/services/usuario';
import { RolService } from '../../../data/services/role';
// --- FIN DE IMPORTACIÓN ---

@Component({
  selector: 'app-manage-users-by-rol',
  templateUrl: './manage-users-by-rol.html',
  styleUrls: ['./manage-users-by-rol.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ManageUsersByRol implements OnInit, OnDestroy {
  roles: IRol[] = [];
  selectedRoleId: string | 'all' = 'all';
  users: IUsuario[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.rolService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles: IRol[]) => {
        this.roles = roles;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los roles.';
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    let observable: Observable<IUsuario[]>;

    if (this.selectedRoleId === 'all') {
      observable = this.usuarioService.getUsuarios();
    } else {
      observable = this.usuarioService.getUsuariosByRoleId(this.selectedRoleId);
    }

    observable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: IUsuario[]) => {
        this.users = users;
        this.isLoading = false;
        console.log('Usuarios cargados:', this.users);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los usuarios.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  onRoleSelect(roleId: string | 'all'): void {
    this.selectedRoleId = roleId;
    this.loadUsers();
  }

  editUser(userId: string): void {
    this.toastr.info(`Editando usuario ${userId}...`);
    this.router.navigate(['/admin/users/edit', userId]);
  }

  deleteUser(userId: string, userName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${userName}? Esta acción es irreversible.`)) {
      this.usuarioService.deleteUsuario(userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Usuario eliminado exitosamente.', '¡Eliminado!');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar usuario. Intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Eliminación');
        }
      });
    }
  }

  getRoleName(roleIdValue: any): string {
    if (roleIdValue && typeof roleIdValue === 'object' && 'nombre' in roleIdValue) {
      return (roleIdValue as IRol).nombre;
    }
    if (typeof roleIdValue === 'string') {
      const foundRole = this.roles.find(role => role._id === roleIdValue);
      return foundRole ? foundRole.nombre : 'Desconocido';
    }
    return 'N/A';
  }
}