// src/app/components/client-profile-edit/client-profile-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que la ruta sea correcta
import { ClienteService } from '../../../data/services/cliente'; // Asegúrate de que la ruta sea correcta
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-profile-edit',
  templateUrl: './client-profile-edit.html',
  styleUrls: ['./client-profile-edit.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class ClientProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  userId: string | null = null;
  clientId: string | null = null; // Necesitaremos el ID del documento de Cliente para la actualización
  loading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clientService: ClienteService,
    private router: Router
  ) {
    // Inicializar el formulario con validaciones mejoradas
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      direccion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      fechaNacimiento: ['', Validators.required],
      preferenciasAlimentarias: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getLoggedInUserId(); // Obtener el ID del usuario logueado
    if (this.userId) {
      this.loadClientData(this.userId);
    } else {
      this.errorMessage = 'No se pudo obtener el ID de usuario. Por favor, inicie sesión de nuevo.';
      this.loading = false;
    }
  }

  loadClientData(userId: string): void {
    this.clientService.getClienteByUsuarioId(userId).pipe(
      catchError(error => {
        console.error('Error al cargar datos del cliente:', error);
        this.errorMessage = 'Error al cargar los datos de tu perfil. Inténtalo de nuevo más tarde.';
        this.loading = false;
        return of(null); // Retorna un observable nulo para que la suscripción no falle
      })
    ).subscribe(cliente => {
      if (cliente) {
        this.clientId = cliente._id; // Guardar el ID del documento de Cliente
        // Formatear la fecha de nacimiento a 'YYYY-MM-DD' para el input type="date"
        const fechaNacimientoFormatted = cliente.fechaNacimiento ?
          new Date(cliente.fechaNacimiento).toISOString().split('T')[0] : '';

        this.profileForm.patchValue({
          username: cliente.usuarioId.username,
          email: cliente.usuarioId.email,
          telefono: cliente.usuarioId.telefono,
          nombre: cliente.usuarioId.nombre,
          apellido: cliente.usuarioId.apellido,
          direccion: cliente.direccion,
          fechaNacimiento: fechaNacimientoFormatted,
          preferenciasAlimentarias: cliente.preferenciasAlimentarias || '',
        });
        this.loading = false;
      } else {
        this.errorMessage = 'No se encontraron datos del cliente.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
      this.profileForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
      return;
    }

    if (!this.clientId) {
      this.errorMessage = 'No se pudo obtener el ID del cliente para actualizar.';
      return;
    }

    this.isSubmitting = true;
    const formData = this.profileForm.value;

    // Crear el objeto de datos a enviar al backend
    const updateData = {
      // Datos del cliente
      direccion: formData.direccion,
      fechaNacimiento: formData.fechaNacimiento,
      preferenciasAlimentarias: formData.preferenciasAlimentarias,
      // Datos del usuario asociado
      username: formData.username,
      email: formData.email,
      telefono: formData.telefono,
      nombre: formData.nombre,
      apellido: formData.apellido,
    };

    console.log('Enviando datos de actualización:', updateData);

    this.clientService.updateCliente(this.clientId, updateData).pipe(
      catchError(error => {
        console.error('Error al actualizar el perfil:', error);
        this.errorMessage = error.error?.mensaje || 'Error al actualizar el perfil. Inténtalo de nuevo.';
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(response => {
      this.isSubmitting = false;
      if (response) {
        console.log('Respuesta del servidor:', response);
        this.successMessage = '¡Perfil actualizado exitosamente! Los cambios se reflejarán en tu próximo inicio de sesión.';
        
        setTimeout(() => {
          this.router.navigate(['/cliente/dashboard']); // Volver al dashboard después de un éxito
        }, 2000); // Esperar 2 segundos antes de redirigir
      }
    });
  }

  // Método para volver al dashboard
  goBackToDashboard(): void {
    this.router.navigate(['/cliente/dashboard']);
  }

  // Método para obtener el mensaje de error de un campo específico
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo es requerido.';
      }
      if (control.errors['email']) {
        return 'Por favor, introduce un email válido.';
      }
      if (control.errors['minlength']) {
        return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
      }
      if (control.errors['maxlength']) {
        return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
      }
      if (control.errors['pattern']) {
        return 'Formato inválido.';
      }
    }
    return '';
  }
}
