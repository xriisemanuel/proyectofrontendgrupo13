import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth'; // Importa tu servicio de autenticación
import { Router } from '@angular/router'; // Para la redirección
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register', // Selector para usar este componente en el HTML
  imports: [FormsModule, CommonModule], // Importaciones de módulos Angular necesarios (vacío aquí, pero puedes agregar módulos si es necesario)
  templateUrl: './register.html', // Archivo HTML asociado
  styleUrls: ['./register.css'] // Archivo CSS asociado
})
export class RegisterComponent implements OnInit {
  // Propiedades para los inputs del formulario de registro
  username = '';
  password = '';
  email = '';
  telefono = '';
  nombre = '';
  apellido = '';
  rolName = 'cliente'; // Rol por defecto al registrar (puedes hacer que sea seleccionable)
  errorMessage = ''; // Mensaje de error
  isSuccessful = false; // Indica si el registro fue exitoso

  // Inyecta AuthService y Router
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // No hay lógica compleja en OnInit para el registro, solo inicialización.
  }

  // Método que se ejecuta al enviar el formulario de registro
  onSubmit(): void {
    this.errorMessage = ''; // Limpia mensajes de error anteriores
    this.isSuccessful = false; // Restablece el estado de éxito

    // Llama al método register del AuthService con todos los datos del formulario
    this.authService.register(
      this.username,
      this.password,
      this.email,
      this.telefono,
      this.rolName, // Se envía el nombre del rol (ej. 'cliente')
      this.nombre,
      this.apellido
    ).subscribe({
      next: data => {
        console.log('Registro exitoso:', data); // Muestra los datos de respuesta en consola
        this.isSuccessful = true; // Actualiza el estado a exitoso
        // Opcional: Redirige al usuario a la página de login después de un registro exitoso
        this.router.navigate(['/login']);
      },
      error: err => {
        // Manejo de errores en caso de que el registro falle
        console.error('Error de registro:', err);
        // Extrae el mensaje de error de la respuesta del backend, o usa un mensaje genérico
        this.errorMessage = err.error?.mensaje || 'Error al registrar. Intente de nuevo.';
      }
    });
  }
}
