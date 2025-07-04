import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth'; // Para registrar el usuario
import { Role, RoleInterface } from '../../../services/role'; // Para obtener los roles
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-user-with-role',
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule]
})
export class CreateUserWithRoleComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  roles: RoleInterface[] = []; // Lista de roles disponibles
  selectedRoleName: string = ''; // El nombre del rol seleccionado actualmente
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true; // Para controlar el estado de carga inicial

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private roleService: Role,
    private router: Router
  ) {
    // Inicializa el formulario con los campos comunes a todos los usuarios
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''], // Opcional
      rolName: ['', Validators.required], // Campo para seleccionar el rol

      // Campos específicos para el rol 'cliente' (inicialmente deshabilitados)
      direccionCliente: [{ value: '', disabled: true }],
      fechaNacimientoCliente: [{ value: '', disabled: true }],
      preferenciasAlimentariasCliente: [{ value: '', disabled: true }], // Nuevo campo
      puntosCliente: [{ value: 0, disabled: true }], // Nuevo campo

      // Campos específicos para el rol 'repartidor' (inicialmente deshabilitados)
      vehiculoRepartidor: [{ value: '', disabled: true }],
      numeroLicenciaRepartidor: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadRoles(); // Carga los roles al inicializar el componente

    // Suscribirse a los cambios del campo 'rolName' para adaptar el formulario
    this.userForm.get('rolName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(roleName => {
      this.onRoleChange(roleName);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los roles disponibles desde el backend.
   */
  loadRoles(): void {
    this.roleService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.roles = data.filter(rol => rol.estado); // Solo roles activos
        this.isLoading = false;
        console.log('Roles cargados:', this.roles);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar la lista de roles.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Adapta el formulario según el rol seleccionado.
   * Habilita/deshabilita campos y añade/elimina validadores.
   * @param roleName El nombre del rol seleccionado.
   */
  onRoleChange(roleName: string): void {
    this.selectedRoleName = roleName;

    // Deshabilitar y limpiar todos los campos específicos de rol por defecto
    this.userForm.get('direccionCliente')?.disable();
    this.userForm.get('direccionCliente')?.clearValidators();
    this.userForm.get('direccionCliente')?.setValue('');

    this.userForm.get('fechaNacimientoCliente')?.disable();
    this.userForm.get('fechaNacimientoCliente')?.clearValidators();
    this.userForm.get('fechaNacimientoCliente')?.setValue('');

    this.userForm.get('preferenciasAlimentariasCliente')?.disable();
    this.userForm.get('preferenciasAlimentariasCliente')?.clearValidators();
    this.userForm.get('preferenciasAlimentariasCliente')?.setValue('');

    this.userForm.get('puntosCliente')?.disable();
    this.userForm.get('puntosCliente')?.clearValidators();
    this.userForm.get('puntosCliente')?.setValue(0);


    this.userForm.get('vehiculoRepartidor')?.disable();
    this.userForm.get('vehiculoRepartidor')?.clearValidators();
    this.userForm.get('vehiculoRepartidor')?.setValue('');

    this.userForm.get('numeroLicenciaRepartidor')?.disable();
    this.userForm.get('numeroLicenciaRepartidor')?.clearValidators();
    this.userForm.get('numeroLicenciaRepartidor')?.setValue('');

    // Habilitar y añadir validadores para los campos del rol seleccionado
    if (roleName === 'cliente') {
      this.userForm.get('direccionCliente')?.enable();
      this.userForm.get('direccionCliente')?.setValidators(Validators.required);
      this.userForm.get('fechaNacimientoCliente')?.enable();
      this.userForm.get('preferenciasAlimentariasCliente')?.enable();
      this.userForm.get('puntosCliente')?.enable();
    } else if (roleName === 'repartidor') {
      this.userForm.get('vehiculoRepartidor')?.enable();
      this.userForm.get('vehiculoRepartidor')?.setValidators(Validators.required);
      this.userForm.get('numeroLicenciaRepartidor')?.enable();
      this.userForm.get('numeroLicenciaRepartidor')?.setValidators(Validators.required);
    }

    // Actualizar la validez de los controles para que los cambios de validadores surtan efecto
    this.userForm.get('direccionCliente')?.updateValueAndValidity();
    this.userForm.get('fechaNacimientoCliente')?.updateValueAndValidity();
    this.userForm.get('preferenciasAlimentariasCliente')?.updateValueAndValidity();
    this.userForm.get('puntosCliente')?.updateValueAndValidity();
    this.userForm.get('vehiculoRepartidor')?.updateValueAndValidity();
    this.userForm.get('numeroLicenciaRepartidor')?.updateValueAndValidity();
  }

  /**
   * Maneja el envío del formulario.
   */
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Asegurarse de que todos los campos relevantes estén habilitados para obtener sus valores
    // (aunque ya los habilitamos en onRoleChange, es una buena práctica para el envío)
    this.userForm.get('direccionCliente')?.enable();
    this.userForm.get('fechaNacimientoCliente')?.enable();
    this.userForm.get('preferenciasAlimentariasCliente')?.enable();
    this.userForm.get('puntosCliente')?.enable();
    this.userForm.get('vehiculoRepartidor')?.enable();
    this.userForm.get('numeroLicenciaRepartidor')?.enable();

    if (this.userForm.valid) {
      const formData = this.userForm.value;
      console.log('Datos del formulario a enviar:', formData);

      // Convertir preferenciasAlimentariasCliente de string a array de strings
      let preferenciasArray: string[] = [];
      if (formData.preferenciasAlimentariasCliente) {
        preferenciasArray = formData.preferenciasAlimentariasCliente.split(',').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
      }

      this.authService.register(
        formData.username,
        formData.password,
        formData.email,
        formData.telefono,
        formData.rolName,
        formData.nombre,
        formData.apellido,
        // Campos específicos de cliente
        formData.direccionCliente,
        formData.fechaNacimientoCliente,
        preferenciasArray, // Enviar como array
        formData.puntosCliente,
        // Campos específicos de repartidor
        formData.vehiculoRepartidor,
        formData.numeroLicenciaRepartidor
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Usuario y perfil de rol creado exitosamente!';
          console.log('Respuesta del backend:', response);
          this.userForm.reset({
            rolName: '', // Reinicia el select de rol
            estado: true // Si tuvieras un campo de estado general para el usuario
          });
          this.selectedRoleName = ''; // Limpia el rol seleccionado para ocultar campos específicos
          // Opcional: Redirigir a la gestión de usuarios o a otro lugar
          setTimeout(() => {
            this.router.navigate(['/admin/users/manage-by-role']); // Redirigir a la vista de gestión por rol
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear usuario y perfil:', err);
          this.errorMessage = err.error?.mensaje || 'Error al crear usuario y perfil. Intente de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Por favor, complete todos los campos requeridos y válidos.';
      this.userForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
      // Después de marcar como tocados, deshabilita los campos específicos de nuevo si no son del rol seleccionado
      this.onRoleChange(this.selectedRoleName);
    }
  }
}
