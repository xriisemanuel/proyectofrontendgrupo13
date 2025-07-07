import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth'; // Asegúrate de que la ruta sea correcta
import { Router } from '@angular/router'; // Para la redirección
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';

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

  onSubmit(): void {
    this.errorMessage = '';
    console.log('onSubmit: Intentando iniciar sesión con usuario:', this.username);

    this.authService.login(this.username, this.password).subscribe({
      next: data => {
        console.log('Login exitoso:', data);
        this.redirectToDashboardByRole();
      },
      error: err => {
        console.error('Error de login:', err);
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Credenciales incorrectas o problema de conexión.';
        console.log('Mensaje de error mostrado:', this.errorMessage);
      }
    });
  }

  private redirectToDashboardByRole(): void {
    const userRole = this.authService.getRole();
    console.log('redirectToDashboardByRole: Rol obtenido (desde AuthService):', userRole);

    // --- INICIO DE DEPURACIÓN AGRESIVA ---
    // Convierte el rol a un formato visible para depuración
    const debugRole = userRole ? `'${userRole}' (length: ${userRole.length})` : 'null';
    console.log('DEBUG: Rol para comparación:', debugRole);
    console.log('DEBUG: Tipo de userRole:', typeof userRole);
    console.log('DEBUG: Comparando con "supervisor_ventas":', userRole === 'supervisor_ventas');
    // --- FIN DE DEPURACIÓN AGRESIVA ---

    if (userRole === 'admin') {
      console.log('Redirigiendo a: /admin/dashboard');
      this.router.navigate(['/admin/dashboard']);
    } else if (userRole === 'cliente') {
      console.log('Redirigiendo a: /cliente/dashboard');
      this.router.navigate(['/cliente/dashboard']);
    } else if (userRole === 'supervisor_cocina') {
      console.log('Redirigiendo a: /kitchen/dashboard');
      this.router.navigate(['/kitchen/dashboard']);
    } else if (userRole === 'supervisor_ventas') { // <-- ¡Esta es la línea clave!
      console.log('Redirigiendo a: /pedido/dashboard'); // Corregido a /pedidos/dashboard
      this.router.navigate(['/pedido/dashboard']);
    } else if (userRole === 'repartidor') {
      console.log('Redirigiendo a: /delivery/dashboard'); // Corregido a /delivery/dashboard
      this.router.navigate(['/delivery/dashboard']);
    } else {
      console.warn('Rol de usuario no reconocido o nulo. Redirigiendo a /dashboard. Valor final de userRole:', userRole);
      this.router.navigate(['/dashboard']);
    }
  }
}
