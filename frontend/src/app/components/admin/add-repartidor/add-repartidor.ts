import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor'; // Importa el servicio de Repartidores
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf

@Component({
  selector: 'app-add-repartidor',
  templateUrl: './add-repartidor.html',
  styleUrls: ['./add-repartidor.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule] // Importa ReactiveFormsModule, RouterLink y CommonModule
})
export class AddRepartidor implements OnInit { // Cambiado a AddRepartidorComponent para consistencia
  repartidorForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  estadosRepartidor: string[] = ['disponible', 'en_entrega', 'fuera_de_servicio']; // Opciones para el estado

  constructor(
    private fb: FormBuilder,
    private repartidorService: RepartidorService, // Inyecta el servicio
    private router: Router
  ) {
    // Inicializa el formulario con los campos del modelo de Repartidor.
    // Los campos 'nombre', 'apellido', 'telefono', 'email' han sido eliminados del formulario
    // ya que ahora residen en el modelo 'Usuario' y se gestionan al registrar el usuario.
    this.repartidorForm = this.fb.group({
      usuarioId: ['', Validators.required], // ID del usuario asociado (debe tener rol 'repartidor')
      estado: ['disponible', Validators.required], // Valor por defecto 'disponible'
      vehiculo: [''], // Opcional
      numeroLicencia: [''] // Opcional
    });
  }

  ngOnInit(): void {
    // No hay lógica de carga inicial compleja para este componente
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.repartidorForm.valid) {
      const newRepartidorData = this.repartidorForm.value;
      console.log('Intentando crear perfil de repartidor:', newRepartidorData);

      this.repartidorService.createRepartidor(newRepartidorData).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Perfil de repartidor creado exitosamente!';
          console.log('Respuesta del backend:', response);
          this.repartidorForm.reset({
            estado: 'disponible' // Reinicia el estado a su valor por defecto
          }); // Limpia el formulario
          // Opcional: Redirigir a la lista de repartidores después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/admin/repartidores/manage']); // Asumiendo una ruta de gestión
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear el perfil de repartidor:', err);
          // Manejo de errores específicos del backend
          if (err.status === 400 && err.error?.mensaje) {
            this.errorMessage = err.error.mensaje;
          } else if (err.status === 404 && err.error?.mensaje) {
            this.errorMessage = err.error.mensaje;
          } else {
            this.errorMessage = 'Error al crear el perfil de repartidor. Intente de nuevo.';
          }
        }
      });
    } else {
      this.errorMessage = 'Por favor, complete todos los campos requeridos y válidos.';
      this.repartidorForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
    }
  }
}
