import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Importa Router y RouterLink
import { Role } from '../../../data/services/role'; // <--- Importa el RoleService
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-roles',
  imports: [CommonModule, RouterLink], // <--- Asegúrate de importar RouterLink si lo usas en la plantilla
  templateUrl: './manage-roles.html',
  styleUrls: ['./manage-roles.css'],
  standalone: true,
})
export class ManageRoles implements OnInit {
  roles: any[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private roleService: Role, // <--- Inyecta el RoleService
    private router: Router // <--- Inyecta Router para la navegación de edición
  ) { }

  ngOnInit(): void {
    this.loadRoles(); // Carga los roles al inicializar el componente
  }

  loadRoles(): void {
    this.errorMessage = '';
    this.successMessage = ''; // Limpiar mensajes anteriores

    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        console.log('Roles cargados desde el backend:', this.roles);
      },
      error: (err) => {
        console.error('Error al cargar los roles:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los roles desde el servidor.';
      }
    });
  }

  editRole(roleId: string): void {
    // Lógica para navegar a una pantalla de edición de rol
    console.log('Navegando para editar rol con ID:', roleId);
    this.router.navigate(['/admin/users/update', roleId]); // Asumiendo una ruta de edición
  }

  deleteRole(roleId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.')) {
      this.roleService.deleteRole(roleId).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Rol eliminado exitosamente!';
          console.log('Rol eliminado:', response);
          this.loadRoles(); // Recarga la lista de roles después de la eliminación
        },
        error: (err) => {
          console.error('Error al eliminar el rol:', err);
          this.errorMessage = err.error?.mensaje || 'Error al eliminar el rol. Asegúrese de que no esté en uso.';
        }
      });
    }
  }
}
