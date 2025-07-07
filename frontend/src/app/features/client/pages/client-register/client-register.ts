import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth'; // Importa tu servicio de autenticación
import { Router, RouterLink } from '@angular/router'; // Para la redirección y RouterLink
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-client-register',
  templateUrl: './client-register.html',
  styleUrls: ['./client-register.css'],
  standalone: true, // Asegura que sea un componente standalone
  imports: [CommonModule, FormsModule, RouterLink] // Importa CommonModule, FormsModule y RouterLink
})
export class ClientRegister implements OnInit {
  username = '';
  password = '';
  email = '';
  telefono = '';
  nombre = '';
  apellido = '';
  rolName = 'cliente'; // <--- ¡HARDCODEADO A 'cliente' para el registro público!
  errorMessage = '';
  isSuccessful = false;

  // Campos específicos para el rol 'cliente'
  direccionCliente = '';
  fechaNacimientoCliente = ''; // Se usará para input type="date"
  preferenciasAlimentariasCliente = ''; // Se manejará como string separado por comas
  puntosCliente = 0; // Por defecto 0

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // No se necesita cargar roles aquí, el rol es fijo 'cliente'
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isSuccessful = false;

    // Validaciones básicas en el frontend antes de enviar
    if (!this.username || !this.password || !this.email || !this.nombre || !this.apellido || !this.direccionCliente) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios.';
      Swal.fire('Error', this.errorMessage, 'error');
      return;
    }

    // Convertir preferenciasAlimentariasCliente de string a array de strings
    let preferenciasArray: string[] = [];
    if (this.preferenciasAlimentariasCliente) {
      preferenciasArray = this.preferenciasAlimentariasCliente.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    // Llama al método register del AuthService con todos los datos del formulario
    this.authService.register(
      this.username,
      this.password,
      this.email,
      this.telefono,
      this.rolName, // 'cliente' por defecto
      this.nombre,
      this.apellido,
      // Campos específicos de cliente
      this.direccionCliente,
      this.fechaNacimientoCliente,
      preferenciasArray, // Enviar como array
      this.puntosCliente,
      // Los campos de repartidor no se envían desde este formulario
      undefined, // vehiculoRepartidor
      undefined  // numeroLicenciaRepartidor
    ).subscribe({
      next: data => {
        console.log('Registro de cliente exitoso:', data);
        this.isSuccessful = true;
        this.errorMessage = ''; // Limpiar cualquier error anterior
        Swal.fire('¡Registro Exitoso!', 'Tu cuenta de cliente ha sido creada.', 'success');

        // *** Paso CRÍTICO: Auto-login y redirección al dashboard del cliente ***
        // ¡CORRECCIÓN AQUÍ! Pasa el username y password como argumentos separados.
        this.authService.login(this.username, this.password).subscribe({
          next: () => {
            console.log('Auto-login exitoso. Redirigiendo a dashboard de cliente.');
            this.router.navigate(['/cliente/dashboard']);
          },
          error: (loginErr) => {
            console.error('Error en auto-login después del registro de cliente:', loginErr);
            Swal.fire('Advertencia', 'Registro exitoso, pero no se pudo iniciar sesión automáticamente. Por favor, inicie sesión manualmente.', 'warning');
            this.router.navigate(['/login']); // Redirige al login si el auto-login falla
          }
        });
      },
      error: err => {
        console.error('Error de registro de cliente:', err);
        this.errorMessage = err.error?.mensaje || 'Error al registrar como cliente. Intente de nuevo.';
        Swal.fire('Error', this.errorMessage, 'error');
      }
    });
  }
}
