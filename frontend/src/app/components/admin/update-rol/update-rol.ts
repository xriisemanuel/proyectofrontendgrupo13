import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Role } from '../../../services/role';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-rol',
  templateUrl: './update-rol.html',
  styleUrls: ['./update-rol.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class UpdateRol implements OnInit {
  roleForm: FormGroup;
  roleId: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true; // Para mostrar un spinner mientras se cargan los datos

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: Role
  ) {
    this.roleForm = this.fb.group({
      nombre: ['', Validators.required],
      estado: [false, Validators.required]
    });
  }

  ngOnInit(): void {
    // Suscribirse a los parámetros de la ruta para obtener el ID
    this.route.paramMap.subscribe(params => {
      this.roleId = params.get('id');
      if (this.roleId) {
        this.loadRoleData(this.roleId);
      } else {
        this.errorMessage = 'No se proporcionó un ID de rol para editar.';
        this.isLoading = false;
      }
    });
  }

  loadRoleData(id: string): void {
    this.isLoading = true;
    this.roleService.getRoleById(id).subscribe({
      next: (role) => {
        // Asegurarse de que el nombre del rol se muestre correctamente (puede que venga en minúsculas del backend)
        this.roleForm.patchValue({
          nombre: role.nombre,
          estado: role.estado
        });
        this.isLoading = false;
        console.log('Datos del rol cargados para edición:', role);
      },
      error: (err) => {
        console.error('Error al cargar datos del rol:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los datos del rol.';
        this.isLoading = false;
        // Si hay un error al cargar, es posible que el ID no exista o no sea válido,
        // por lo que el formulario no debería ser interactuable o debería redirigir.
        // this.router.navigate(['/admin/roles/manage']); // Opcional: redirigir en caso de error de carga
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.roleForm.valid && this.roleId) { // Asegúrate de que roleId no sea nulo aquí
      const updatedRoleData = this.roleForm.value;
      console.log('Intentando actualizar rol:', updatedRoleData);

      this.roleService.updateRole(this.roleId, updatedRoleData).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Rol actualizado exitosamente!';
          console.log('Respuesta del backend:', response);
          // Opcional: Redirigir a la lista de roles después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/admin/roles/manage']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al actualizar el rol:', err);
          // Muestra un mensaje de error más específico si el nombre ya existe
          if (err.status === 400 && err.error?.mensaje && err.error.mensaje.includes('ya está en uso')) {
            this.errorMessage = err.error.mensaje;
          } else {
            this.errorMessage = err.error?.mensaje || 'Error al actualizar el rol. Intente de nuevo.';
          }
        }
      });
    } else {
      // Este mensaje se muestra si el formulario no es válido o si roleId es nulo
      this.errorMessage = 'Por favor, complete todos los campos requeridos o el ID del rol no es válido.';
      this.roleForm.markAllAsTouched(); // Asegura que los errores de validación se muestren en el HTML
    }
  }
}
