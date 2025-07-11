import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import { RepartidorService } from '../../data/services/repartidor';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delivery-profile-edit',
  templateUrl: './delivery-profile-edit.html',
  styleUrls: ['./delivery-profile-edit.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class DeliveryProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  userId: string | null = null;
  repartidorId: string | null = null;
  loading: boolean = true;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private repartidorService: RepartidorService,
    private router: Router
  ) {
    // Inicializar el formulario con validaciones para repartidor
    this.profileForm = this.fb.group({
      // Datos del usuario
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      // Datos específicos del repartidor
      vehiculo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      numeroLicencia: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      estado: ['disponible', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getLoggedInUserId();
    if (this.userId) {
      this.loadRepartidorData(this.userId);
    } else {
      this.errorMessage = 'No se pudo obtener el ID de usuario. Por favor, inicie sesión de nuevo.';
      this.loading = false;
    }
  }

  loadRepartidorData(userId: string): void {
    this.repartidorService.getRepartidorByUserId(userId).pipe(
      catchError(error => {
        console.error('Error al cargar datos del repartidor:', error);
        this.errorMessage = 'Error al cargar los datos de tu perfil. Inténtalo de nuevo más tarde.';
        this.loading = false;
        return of(null);
      })
    ).subscribe(repartidor => {
      if (repartidor) {
        this.repartidorId = repartidor._id;
        
        // Cargar datos del usuario y repartidor
        this.profileForm.patchValue({
          username: repartidor.usuarioId.username,
          email: repartidor.usuarioId.email,
          telefono: repartidor.usuarioId.telefono,
          nombre: repartidor.usuarioId.nombre,
          apellido: repartidor.usuarioId.apellido,
          vehiculo: repartidor.vehiculo || '',
          numeroLicencia: repartidor.numeroLicencia || '',
          estado: repartidor.estado || 'disponible',
        });
        this.loading = false;
      } else {
        this.errorMessage = 'No se encontraron datos del repartidor.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.repartidorId) {
      this.errorMessage = 'No se pudo obtener el ID del repartidor para actualizar.';
      return;
    }

    this.isSubmitting = true;
    const formData = this.profileForm.value;

    // Crear el objeto de datos a enviar al backend
    const updateData = {
      // Datos específicos del repartidor
      vehiculo: formData.vehiculo,
      numeroLicencia: formData.numeroLicencia,
      estado: formData.estado,
      // Datos del usuario asociado
      username: formData.username,
      email: formData.email,
      telefono: formData.telefono,
      nombre: formData.nombre,
      apellido: formData.apellido,
    };

    console.log('Enviando datos de actualización:', updateData);

    // Por ahora, usaremos el método de cambiar estado para el estado
    // y necesitaremos crear un método de actualización completa en el servicio
    this.repartidorService.updateRepartidor(this.repartidorId, updateData).pipe(
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
          this.router.navigate(['/delivery/dashboard']);
        }, 2000);
      }
    });
  }

  goBackToDashboard(): void {
    this.router.navigate(['/delivery/dashboard']);
  }

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
