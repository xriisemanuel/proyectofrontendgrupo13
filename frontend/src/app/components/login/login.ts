import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth'; // Importa tu servicio de autenticación
import { Router } from '@angular/router'; // Para la redirección
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login', // Selector para usar este componente en el HTML
  imports: [FormsModule, CommonModule ], // Importaciones de módulos Angular necesarios (vacío aquí, pero puedes agregar módulos si es necesario)
  templateUrl: './login.html', // Archivo HTML asociado
  styleUrls: ['./login.css'] // Archivo CSS asociado
})
export class LoginComponent implements OnInit {
  username = ''; // Propiedad para el input de usuario
  password = ''; // Propiedad para el input de contraseña
  errorMessage = ''; // Mensaje de error a mostrar en la UI
  isLoggedIn = false; // Indica si el usuario ya está autenticado

  // Inyecta el AuthService y el Router en el constructor
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Al inicializar el componente, verifica si el usuario ya está autenticado.
    // Si lo está, redirige al dashboard principal para evitar que intente loguearse de nuevo.
    if (this.authService.isAuthenticated()) {
      this.isLoggedIn = true;
      // Redirige al dashboard o a la ruta principal de tu aplicación
      // Las rutas específicas (ej. /admin/dashboard) se manejarán después del login exitoso
      this.router.navigate(['/dashboard']);
    }
  }

  // Método que se ejecuta al enviar el formulario de login
  onSubmit(): void {
    this.errorMessage = ''; // Limpia cualquier mensaje de error anterior

    // Llama al método login del AuthService con el username y password
    this.authService.login(this.username, this.password).subscribe({
      next: data => {
        console.log('Login exitoso:', data); // Muestra los datos de respuesta en consola
        this.isLoggedIn = true; // Actualiza el estado a logueado

        // Redirige al usuario a un dashboard específico según su rol
        const userRole = this.authService.getRole();
        if (userRole === 'admin') {
          this.router.navigate(['/admin/dashboard']); // Redirige a la ruta de dashboard de administrador
        } else if (userRole === 'cliente') {
          this.router.navigate(['/cliente/dashboard']); // Redirige a la ruta de dashboard de cliente
        } else {
          this.router.navigate(['/dashboard']); // Redirige a un dashboard genérico para otros roles
        }
      },
      error: err => {
        // Manejo de errores en caso de que el login falle
        console.error('Error de login:', err);
        // Extrae el mensaje de error de la respuesta del backend, o usa un mensaje genérico
        this.errorMessage = err.error?.mensaje || 'Error al iniciar sesión. Intente de nuevo.';
      }
    });
  }
}
