import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida
import { Router, RouterLink } from '@angular/router'; // Para la redirección y RouterLink
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import Swal from 'sweetalert2'; // Para alertas bonitas

@Component({
  selector: 'app-register',
  templateUrl: './register.html', // Nombre de archivo corregido
  styleUrls: ['./register.css'], // Nombre de archivo corregido
  standalone: true, // Asegura que sea un componente standalone
  imports: [CommonModule, FormsModule, RouterLink] // Importa CommonModule, FormsModule y RouterLink
})
export class RegisterComponent implements OnInit {
  username = '';
  password = '';
  email = '';
  telefono = '';
  nombre = '';
  apellido = '';
  rolName = 'cliente'; // <--- Por defecto, los registros públicos son para clientes.
  errorMessage = '';
  isSuccessful = false;

  // Campos específicos para el rol 'cliente'
  direccionCliente = '';
  fechaNacimientoCliente = '';
  preferenciasAlimentariasCliente = ''; // Se manejará como string separado por comas
  puntosCliente = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // No necesitamos cargar roles si el rol es fijo 'cliente'
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
      undefined,
      undefined
    ).subscribe({
      next: data => {
        console.log('Registro exitoso:', data);
        this.isSuccessful = true;
        this.errorMessage = ''; // Limpiar cualquier error anterior
        Swal.fire('¡Registro Exitoso!', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.', 'success');
        // Opcional: Redirige al usuario a la página de login después de un registro exitoso
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // Redirige después de 2 segundos
      },
      error: err => {
        console.error('Error de registro:', err);
        this.errorMessage = err.error?.mensaje || 'Error al registrar. Intente de nuevo.';
        Swal.fire('Error', this.errorMessage, 'error');
      }
    });
  }
}
