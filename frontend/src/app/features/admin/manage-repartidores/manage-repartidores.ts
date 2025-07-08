// src/app/features/admin/manage-repartidores/manage-repartidores.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { UsuarioService } from '../../../data/services/usuario';
import { RolService } from '../../../data/services/role';
import { IUsuario, IRol } from '../../../shared/interfaces'; // Asegúrate de que IUsuario e IRol estén bien definidos aquí

@Component({
  selector: 'app-manage-repartidores',
  templateUrl: './manage-repartidores.html',
  styleUrls: ['./manage-repartidores.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ManageRepartidores implements OnInit, OnDestroy {
  repartidores: IUsuario[] = [];
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();
  private repartidorRoleId: string | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.findRepartidorRoleAndLoadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  findRepartidorRoleAndLoadUsers(): void {
    this.isLoading = true;
    this.rolService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles: IRol[]) => {
        const repartidorRole = roles.find(role => role.nombre.toLowerCase() === 'repartidor');
        if (repartidorRole) {
          this.repartidorRoleId = repartidorRole._id;
          this.loadRepartidores();
        } else {
          this.toastr.error('Rol "repartidor" no encontrado en el sistema. Asegúrate de que exista.', 'Error de Configuración');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar roles para encontrar "repartidor":', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los roles para identificar repartidores.';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  loadRepartidores(): void {
    if (!this.repartidorRoleId) {
      this.toastr.error('ID del rol "repartidor" no disponible. Esto no debería ocurrir.', 'Error Interno');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.usuarioService.getUsuariosByRoleId(this.repartidorRoleId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: IUsuario[]) => {
        // --- FILTRO TEMPORAL DEL LADO DEL CLIENTE ---
        // Esto asegura que solo se muestren los usuarios cuyo rol coincide con el ID de repartidor,
        // en caso de que el backend no esté filtrando correctamente.
        this.repartidores = users.filter(user => {
            // Asegúrate de que user.rolId sea un objeto y tenga la propiedad _id
            return user.rolId && typeof user.rolId === 'object' && '_id' in user.rolId && (user.rolId as IRol)._id === this.repartidorRoleId;
        });
        // --- FIN FILTRO TEMPORAL ---

        this.isLoading = false;
        console.log('Repartidores cargados (después del filtro de frontend si aplica):', this.repartidores);
      },
      error: (err) => {
        console.error('Error al cargar repartidores:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de repartidores.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  editRepartidor(userId: string): void {
    this.toastr.info(`Redirigiendo para editar repartidor con ID: ${userId}.`);
    this.router.navigate(['/admin/users/edit', userId]);
  }

  deleteRepartidor(userId: string, userName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al repartidor ${userName}? Esta acción es irreversible.`)) {
      this.usuarioService.deleteUsuario(userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Repartidor eliminado exitosamente.', '¡Eliminado!');
          this.loadRepartidores();
        },
        error: (err) => {
          console.error('Error al eliminar repartidor:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar repartidor. Intente de nuevo.';
          this.toastr.error(errorMessage, 'Error de Eliminación');
        }
      });
    }
  }

  getRoleName(user: IUsuario): string {
    return (user.rolId && typeof user.rolId === 'object' && 'nombre' in user.rolId) ? (user.rolId as IRol).nombre : 'Desconocido';
  }
}