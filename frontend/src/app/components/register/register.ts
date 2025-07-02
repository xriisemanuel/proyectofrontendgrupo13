import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth'; // Importa tu servicio de autenticación
import { Router } from '@angular/router'; // Para la redirección
import { Role } from '../../services/role'; // <--- ¡NUEVA IMPORTACIÓN! Para obtener los roles
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, FormsModule] // <--- Importa CommonModule y FormsModule
})
export class RegisterComponent implements OnInit {
  username = '';
  password = '';
  email = '';
  telefono = '';
  nombre = '';
  apellido = '';
  rolName = ''; // Inicialmente vacío, se llenará con el primer rol disponible (no cliente) o por defecto.
  errorMessage = '';
  isSuccessful = false;
  roles: any[] = []; // <--- Propiedad para almacenar los roles disponibles

  constructor(
    private authService: AuthService,
    private router: Router,
    private roleService: Role // <--- ¡NUEVA INYECCIÓN!
  ) { }

  ngOnInit(): void {
    // Carga los roles disponibles al inicializar el componente
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        // Filtra el rol 'cliente' si no quieres que sea seleccionable en este formulario de registro
        this.roles = data.filter(role => role.nombre !== 'cliente');
        if (this.roles.length > 0) {
          this.rolName = this.roles[0].nombre; // Establece el primer rol como valor por defecto
        }
        console.log('Roles cargados:', this.roles);
      },
      error: (err) => {
        console.error('Error al cargar los roles:', err);
        this.errorMessage = 'Error al cargar los roles disponibles. Intente de nuevo más tarde.';
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isSuccessful = false;

    // Llama al método register del AuthService con todos los datos del formulario
    this.authService.register(
      this.username,
      this.password,
      this.email,
      this.telefono,
      this.rolName, // Se envía el nombre del rol seleccionado
      this.nombre,
      this.apellido
    ).subscribe({
      next: data => {
        console.log('Registro exitoso:', data);
        this.isSuccessful = true;
        // Opcional: Redirige al usuario a la página de login después de un registro exitoso
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // Redirige después de 2 segundos
      },
      error: err => {
        console.error('Error de registro:', err);
        this.errorMessage = err.error?.mensaje || 'Error al registrar. Intente de nuevo.';
      }
    });
  }
}
