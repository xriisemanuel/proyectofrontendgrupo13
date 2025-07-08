// src/app/features/admin/manage-supervisores-cocina/manage-supervisores-cocina.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa los servicios y las interfaces necesarias desde shared/interfaces
import { UsuarioService } from '../../../data/services/usuario';
import { RolService } from '../../../data/services/role';
import { IUsuario, IRol } from '../../../shared/interfaces';

@Component({
  selector: 'app-manage-supervisores-cocina',
  templateUrl: './manage-supervisores-cocina.html',
  styleUrls: ['./manage-supervisores-cocina.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Necesario para directivas estructurales y navegación
})
export class ManageSupervisoresCocina implements OnInit, OnDestroy {
  supervisoresCocina: IUsuario[] = []; // Lista de usuarios que son supervisores de cocina
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();
  private supervisorCocinaRoleId: string | null = null; // Para almacenar el ID del rol 'supervisor_cocina'

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.findSupervisorCocinaRoleAndLoadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Busca el ID del rol 'supervisor_cocina' y luego carga los usuarios con ese rol.
   */
  findSupervisorCocinaRoleAndLoadUsers(): void {
    this.isLoading = true;
    this.rolService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles: IRol[]) => {
        // Asume que el nombre del rol en tu backend es 'supervisor_cocina' o 'supervisor cocina'
        const supervisorCocinaRole = roles.find(role => role.nombre.toLowerCase().includes('supervisor') && role.nombre.toLowerCase().includes('cocina'));
        if (supervisorCocinaRole) {
          this.supervisorCocinaRoleId = supervisorCocinaRole._id;
          this.loadSupervisoresCocina(); // Cargar supervisores de cocina una vez que se tiene el ID del rol
        } else {
          this.toastr.error('Rol "supervisor de cocina" no encontrado en el sistema. Asegúrate de que exista.', 'Error de Configuración');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar roles para encontrar "supervisor de cocina":', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los roles para identificar supervisores de cocina.';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los usuarios que tienen el rol de 'supervisor_cocina'.
   */
  loadSupervisoresCocina(): void {
    if (!this.supervisorCocinaRoleId) {
      this.toastr.error('ID del rol "supervisor de cocina" no disponible. Esto no debería ocurrir.', 'Error Interno');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.usuarioService.getUsuariosByRoleId(this.supervisorCocinaRoleId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: IUsuario[]) => {
        // --- FILTRO TEMPORAL DEL LADO DEL CLIENTE (por si el backend no filtra) ---
        this.supervisoresCocina = users.filter(user => {
            return user.rolId && typeof user.rolId === 'object' && '_id' in user.rolId && (user.rolId as IRol)._id === this.supervisorCocinaRoleId;
        });
        // --- FIN FILTRO TEMPORAL ---

        this.isLoading = false;
        console.log('Supervisores de Cocina cargados (después del filtro de frontend si aplica):', this.supervisoresCocina);
      },
      error: (err) => {
        console.error('Error al cargar supervisores de cocina:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de supervisores de cocina.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la página de edición de usuario para un supervisor de cocina.
   * @param userId El ID del usuario supervisor de cocina a editar.
   */
  editSupervisorCocina(userId: string): void {
    this.toastr.info(`Redirigiendo para editar supervisor de cocina con ID: ${userId}.`);
    this.router.navigate(['/admin/users/edit', userId]); // Usa la ruta general de edición de usuario
  }

  /**
   * Elimina un usuario supervisor de cocina después de confirmar.
   * @param userId El ID del usuario supervisor de cocina a eliminar.
   * @param userName El nombre del usuario supervisor de cocina para el mensaje de confirmación.
   */
  deleteSupervisorCocina(userId: string, userName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al supervisor de cocina ${userName}? Esta acción es irreversible.`)) {
      this.usuarioService.deleteUsuario(userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Supervisor de cocina eliminado exitosamente.', '¡Eliminado!');
          this.loadSupervisoresCocina(); // Recargar la lista después de la eliminación
        },
        error: (err) => {
          console.error('Error al eliminar supervisor de cocina:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar supervisor de cocina. Intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Eliminación');
        }
      });
    }
  }

  /**
   * Helper para obtener el nombre del rol a partir de un objeto de usuario.
   * @param user El objeto IUsuario.
   */
  getRoleName(user: IUsuario): string {
    return (user.rolId && typeof user.rolId === 'object' && 'nombre' in user.rolId) ? (user.rolId as IRol).nombre : 'Desconocido';
  }
}