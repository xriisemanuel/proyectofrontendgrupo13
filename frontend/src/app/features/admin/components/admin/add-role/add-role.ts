import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Importa ReactiveFormsModule
import { Router, RouterLink } from '@angular/router'; // Para la redirección
import { Role } from '../../../../../data/services/role'; // Asegúrate de tener un servicio para manejar roles

@Component({
  selector: 'app-add-role',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './add-role.html',
  styleUrl: './add-role.css',
  standalone: true
})

export class AddRole implements OnInit {
  roleForm: FormGroup; // La instancia de nuestro formulario reactivo
  errorMessage: string = ''; // Para mostrar mensajes de error
  successMessage: string = ''; // Para mostrar mensajes de éxito

  // Inyectamos FormBuilder para construir el formulario
  // y Router para la navegación
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private roleService: Role // Asegúrate de que el servicio esté correctamente importado
    // private roleService: RoleService // Lo inyectaremos cuando lo creemos
  ) {
    // Inicializamos el formulario con sus controles y validadores
    this.roleForm = this.fb.group({
      nombre: ['', Validators.required], // Campo 'nombre' (string) - requerido
      estado: [true, Validators.required] // Campo 'estado' (boolean) - por defecto 'true', requerido
    });
  }

  ngOnInit(): void {
    // No hay lógica compleja de inicialización por ahora
  }

  // Método que se ejecuta al enviar el formulario
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.roleForm.valid) {
      const newRoleData = this.roleForm.value;
      console.log('Intentando crear rol:', newRoleData);

      // Llama al servicio para crear el rol en el backend
      this.roleService.createRole(newRoleData).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Rol creado exitosamente!';
          this.roleForm.reset({ nombre: '', estado: true }); // Reinicia el formulario
          console.log('Respuesta del backend:', response);
          // Opcional: Redirigir a la lista de roles después de un tiempo
          // setTimeout(() => {
          //   this.router.navigate(['/admin/roles/manage']);
          // }, 2000);
        },
        error: (err) => {
          console.error('Error al crear el rol:', err);
          this.errorMessage = err.error?.mensaje || 'Error al crear el rol. Por favor, intente de nuevo.';
        }
      });

    } else {
      this.errorMessage = 'Por favor, complete todos los campos requeridos.';
      this.roleForm.markAllAsTouched();
    }
  }
}
