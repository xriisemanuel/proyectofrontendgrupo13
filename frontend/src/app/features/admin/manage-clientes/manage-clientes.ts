// src/app/features/admin/manage-clientes/manage-clientes.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Importa los servicios y las interfaces necesarias desde shared/interfaces
import { UsuarioService } from '../../../data/services/usuario';
import { RolService } from '../../../data/services/role';
import { IUsuario, IRol, IClientePerfil } from '../../../shared/interfaces';

@Component({
  selector: 'app-manage-clientes',
  templateUrl: './manage-clientes.html',
  styleUrls: ['./manage-clientes.css'],
  standalone: true,
  imports: [CommonModule, RouterLink] // Necesario para directivas estructurales y navegación
})
export class ManageClientes implements OnInit, OnDestroy {
  clientes: IUsuario[] = []; // Lista de usuarios que son clientes
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();
  private clienteRoleId: string | null = null; // Para almacenar el ID del rol 'cliente'

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.findClienteRoleAndLoadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Busca el ID del rol 'cliente' y luego carga los usuarios con ese rol.
   */
  findClienteRoleAndLoadUsers(): void {
    this.isLoading = true;
    this.rolService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles: IRol[]) => {
        const clienteRole = roles.find(role => role.nombre.toLowerCase() === 'cliente');
        if (clienteRole) {
          this.clienteRoleId = clienteRole._id;
          this.loadClientes(); // Cargar clientes una vez que se tiene el ID del rol
        } else {
          this.toastr.error('Rol "cliente" no encontrado en el sistema. Asegúrate de que exista.', 'Error de Configuración');
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar roles para encontrar "cliente":', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los roles para identificar clientes.';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los usuarios que tienen el rol de 'cliente'.
   */
  loadClientes(): void {
    if (!this.clienteRoleId) {
      this.toastr.error('ID del rol "cliente" no disponible. Esto no debería ocurrir.', 'Error Interno');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.usuarioService.getUsuariosByRoleId(this.clienteRoleId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (users: IUsuario[]) => {
        // --- FILTRO TEMPORAL DEL LADO DEL CLIENTE (por si el backend no filtra) ---
        this.clientes = users.filter(user => {
            return user.rolId && typeof user.rolId === 'object' && '_id' in user.rolId && (user.rolId as IRol)._id === this.clienteRoleId;
        });
        // --- FIN FILTRO TEMPORAL ---

        this.isLoading = false;
        console.log('Clientes cargados (después del filtro de frontend si aplica):', this.clientes);
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de clientes.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
      }
    });
  }

  /**
   * Navega a la página de edición de usuario para un cliente.
   * @param userId El ID del usuario cliente a editar.
   */
  editCliente(userId: string): void {
    this.toastr.info(`Redirigiendo para editar cliente con ID: ${userId}.`);
    this.router.navigate(['/admin/users/edit', userId]); // Usa la ruta general de edición de usuario
  }

  /**
   * Elimina un usuario cliente después de confirmar.
   * @param userId El ID del usuario cliente a eliminar.
   * @param userName El nombre del usuario cliente para el mensaje de confirmación.
   */
  deleteCliente(userId: string, userName: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al cliente ${userName}? Esta acción es irreversible.`)) {
      this.usuarioService.deleteUsuario(userId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.toastr.success(response.mensaje || 'Cliente eliminado exitosamente.', '¡Eliminado!');
          this.loadClientes(); // Recargar la lista después de la eliminación
        },
        error: (err) => {
          console.error('Error al eliminar cliente:', err);
          const errorMessage = err.error?.mensaje || 'Error al eliminar cliente. Intente de nuevo.';
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

  /**
   * Helper para obtener las preferencias alimentarias como un string.
   * @param clientePerfil El perfil del cliente.
   */
  getPreferenciasAlimentarias(clientePerfil: IClientePerfil | undefined): string {
    return clientePerfil?.preferenciasAlimentarias?.join(', ') || 'N/A';
  }
}