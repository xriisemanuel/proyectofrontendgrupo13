import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que la ruta sea correcta
import { Router, RouterLink } from '@angular/router'; // Para la redirección
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

@Component({
  selector: 'app-login', // Selector para usar este componente en el HTML
  standalone: true, // Marca el componente como standalone si no está en un NgModule
  imports: [FormsModule, CommonModule, RouterLink], // Importaciones de módulos Angular necesarios
  templateUrl: './login.html', // Archivo HTML asociado
  styleUrls: ['./login.css'] // Archivo CSS asociado
})
export class LoginComponent implements OnInit {
  username = ''; // Propiedad para el input de usuario
  password = ''; // Propiedad para el input de contraseña
  errorMessage = ''; // Mensaje de error a mostrar en la UI

  // Inyecta el AuthService y el Router en el constructor
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit: Verificando autenticación...');
    if (this.authService.isAuthenticated()) {
      console.log('LoginComponent ngOnInit: Usuario ya autenticado. Redirigiendo...');
      this.redirectToDashboardByRole();
    } else {
      console.log('LoginComponent ngOnInit: Usuario no autenticado. Mostrar formulario de login.');
    }
  }

  // Método que se ejecuta al enviar el formulario de login
  onSubmit(): void {
    this.errorMessage = ''; // Limpia cualquier mensaje de error anterior
    console.log('onSubmit: Intentando iniciar sesión con usuario:', this.username);

    // Llama al método login del AuthService con el username y password
    this.authService.login(this.username, this.password).subscribe({
      next: data => {
        console.log('Login exitoso:', data); // Muestra los datos de respuesta en consola
        this.redirectToDashboardByRole(); // Redirige al usuario a un dashboard específico según su rol
      },
      error: err => {
        // Manejo de errores en caso de que el login falle
        console.error('Error de login:', err);
        // Extrae el mensaje de error de la respuesta del backend, o usa un mensaje genérico
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Credenciales incorrectas o problema de conexión.';
        console.log('Mensaje de error mostrado:', this.errorMessage);
      }
    });
  }

  /**
   * Redirige al usuario a su dashboard específico basado en su rol.
   * Este método se usa tanto en ngOnInit (si ya está logueado) como en onSubmit (después de un login exitoso).
   */
  private redirectToDashboardByRole(): void {
    const userRole = this.authService.getRole(); // Obtiene el rol del usuario desde el servicio de autenticación
    console.log('redirectToDashboardByRole: Rol obtenido:', userRole);

    if (userRole === 'admin') {
      console.log('Redirigiendo a: /admin/dashboard');
      this.router.navigate(['/admin/dashboard']); // Redirige al dashboard de administrador
    } else if (userRole === 'cliente') {
      console.log('Redirigiendo a: /cliente/dashboard');
      this.router.navigate(['/cliente/dashboard']); // Redirige al dashboard de cliente
    } else if (userRole === 'supervisor_cocina') {
      console.log('Redirigiendo a: /kitchen/dashboard');
      this.router.navigate(['/kitchen/dashboard']); // Redirige al dashboard de supervisor de cocina
    } else if (userRole === 'supervisor_ventas') {
      console.log('Redirigiendo a: /sales/dashboard');
      this.router.navigate(['/sales/dashboard']); // Redirige al dashboard de supervisor de ventas
    } else if (userRole === 'repartidor') {
      console.log('Redirigiendo a: /delivery/dashboard');
      this.router.navigate(['/delivery/dashboard']); // Redirige al dashboard de repartidor
    } else {
      // Si el rol no es reconocido o es nulo, redirige a una página por defecto o a login
      console.warn('Rol de usuario no reconocido o nulo. Redirigiendo a /dashboard.');
      this.router.navigate(['/dashboard']); // Redirige a un dashboard genérico o a una página de inicio
    }
  }
}
