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
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clientService: ClienteService,
    private router: Router
  ) {
    // Inicializar el formulario con campos vacíos o valores por defecto
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      direccion: ['', Validators.required],
      fechaNacimiento: ['', Validators.required], // Usaremos tipo 'date' en HTML
      preferenciasAlimentarias: ['', Validators.required],
      // No incluimos 'puntos' aquí ya que no debería ser editable por el cliente
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
          preferenciasAlimentarias: cliente.preferenciasAlimentarias,
        });
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

    this.clientService.updateCliente(this.clientId, updateData).pipe(
      catchError(error => {
        console.error('Error al actualizar el perfil:', error);
        this.errorMessage = error.error?.mensaje || 'Error al actualizar el perfil. Inténtalo de nuevo.';
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = '¡Perfil actualizado exitosamente!';
        // Opcional: Recargar los datos del usuario en AuthService si es necesario
        // this.authService.loadUserDataFromToken();
        setTimeout(() => {
          this.router.navigate(['/client/dashboard']); // Volver al dashboard después de un éxito
        }, 2000); // Esperar 2 segundos antes de redirigir
      }
    });
  }

  // Método para volver al dashboard
  goBackToDashboard(): void {
    this.router.navigate(['cliente/dashboard']);
  }
}
