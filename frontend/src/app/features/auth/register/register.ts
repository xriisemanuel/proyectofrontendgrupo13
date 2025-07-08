// src/app/features/auth/register/register.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Para la redirección y RouterLink
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { ToastrService } from 'ngx-toastr'; // <--- Usamos ToastrService para alertas

// --- Importaciones corregidas ---
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida a auth.service.ts
import { IRegisterUserPayload } from '../../../core/auth/auth.interface'; // Importa la interfaz del payload
// --- Fin Importaciones corregidas ---

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
  rolName = 'cliente'; // Por defecto, los registros públicos son para clientes.

  // --- ELIMINADAS: errorMessage y isSuccessful ya no son necesarias aquí, Toastr las maneja. ---
  // errorMessage = '';
  // isSuccessful = false;

  // Campos específicos para el rol 'cliente'
  direccionCliente = '';
  fechaNacimientoCliente = '';
  preferenciasAlimentariasCliente = ''; // Se manejará como string separado por comas
  puntosCliente = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService // <--- Inyecta ToastrService
  ) { }

  ngOnInit(): void {
    // No necesitamos cargar roles si el rol es fijo 'cliente'
  }

  onSubmit(): void {
    // No necesitamos resetear errorMessage/isSuccessful aquí, Toastr los gestiona.

    // Validaciones básicas en el frontend antes de enviar
    if (!this.username || !this.password || !this.email || !this.nombre || !this.apellido || !this.direccionCliente) {
      this.toastr.error('Por favor, complete todos los campos obligatorios.', 'Error de Registro'); // <--- Usando Toastr
      return;
    }

    // Convertir preferenciasAlimentariasCliente de string a array de strings
    let preferenciasArray: string[] | null = null; // Puede ser null si no hay preferencias
    if (this.preferenciasAlimentariasCliente) {
      preferenciasArray = this.preferenciasAlimentariasCliente.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    // --- CAMBIO CLAVE: Construir el payload de registro según IRegisterUserPayload ---
    const registerPayload: IRegisterUserPayload = {
      username: this.username,
      password: this.password, // <--- Ahora coincide con la interfaz IRegisterUserPayload y el backend
      email: this.email,
      telefono: this.telefono || null, // Asegura que sea null si está vacío
      rolName: this.rolName,
      nombre: this.nombre,
      apellido: this.apellido,
      // Campos específicos de cliente (se envían si están presentes)
      direccionCliente: this.direccionCliente || null,
      fechaNacimientoCliente: this.fechaNacimientoCliente || null, // Si es un campo de fecha, asegúrate del formato correcto (ISO 8601)
      preferenciasAlimentariasCliente: preferenciasArray,
      puntosCliente: this.puntosCliente !== undefined && this.puntosCliente !== null ? this.puntosCliente : null,
      // Los campos de repartidor no se incluyen en este formulario de registro de cliente
      vehiculoRepartidor: null,
      numeroLicenciaRepartidor: null
    };

    // Llama al método register del AuthService con el objeto payload completo
    this.authService.register(registerPayload).subscribe({
      next: data => {
        console.log('Registro exitoso:', data);
        this.toastr.success('Tu cuenta ha sido creada. Ahora puedes iniciar sesión.', '¡Registro Exitoso!'); // <--- Usando Toastr
        // Opcional: Redirige al usuario a la página de login después de un registro exitoso
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // Redirige después de 2 segundos
      },
      error: err => {
        console.error('Error de registro:', err);
        const errorMessage = err.error?.mensaje || 'Error al registrar. Intente de nuevo.';
        this.toastr.error(errorMessage, 'Error de Registro'); // <--- Usando Toastr
      }
    });
  }
}