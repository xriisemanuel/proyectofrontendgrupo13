// proyecto/frontend/src/app/modules/admin/components/create-user/create-user.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr'; // <-- NUEVO: Importa ToastrService

// Importa AuthService para el registro y UsuarioService para obtener roles
import { AuthService } from '../../../../../core/auth/auth';
import { IRegisterUserPayload } from '../../../../../core/auth/auth.interface'; // Importa la interfaz del payload
import { UsuarioService, IRol } from '../../../../../data/services/usuario'; // Ruta e interfaz corregidas

@Component({
  selector: 'app-create-user-with-role',
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule] // No necesitas importar ToastrModule aquí si ya está en AppModule o main.ts
})
export class CreateUserWithRoleComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  roles: IRol[] = [];
  selectedRoleName: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService // <-- NUEVO: Inyecta ToastrService
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]], // Opcional, pero con patrón si se llena
      rolName: ['', Validators.required],

      // Campos específicos para el rol 'cliente' (inicialmente deshabilitados)
      direccionCliente: [{ value: '', disabled: true }],
      fechaNacimientoCliente: [{ value: '', disabled: true }],
      preferenciasAlimentariasCliente: [{ value: '', disabled: true }],
      puntosCliente: [{ value: 0, disabled: true }],

      // Campos específicos para el rol 'repartidor' (inicialmente deshabilitados)
      vehiculoRepartidor: [{ value: '', disabled: true }],
      numeroLicenciaRepartidor: [{ value: '', disabled: true }]
    });

    // Suscribirse a los cambios del rol para activar/desactivar campos específicos
    this.userForm.get('rolName')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(roleName => {
      this.onRoleChange(roleName);
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.usuarioService.getRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: IRol[]) => {
        this.roles = data.filter(rol => rol.estado); // Solo roles activos
        this.isLoading = false;
        console.log('Roles cargados:', this.roles);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar la lista de roles.';
        this.toastr.error(errorMessage, 'Error'); // <-- Usar Toastr para errores
        this.isLoading = false;
      }
    });
  }

  onRoleChange(roleName: string): void {
    this.selectedRoleName = roleName;

    // Lista de todos los campos específicos de cliente y repartidor
    const allSpecificFields = [
      'direccionCliente', 'fechaNacimientoCliente', 'preferenciasAlimentariasCliente', 'puntosCliente',
      'vehiculoRepartidor', 'numeroLicenciaRepartidor'
    ];

    // 1. Deshabilitar y limpiar validadores y valores de TODOS los campos específicos.
    allSpecificFields.forEach(field => {
      const control = this.userForm.get(field);
      control?.disable();
      control?.clearValidators();
      if (field === 'puntosCliente') {
        control?.setValue(0); // Reiniciar puntos a 0
      } else {
        control?.setValue(''); // Limpiar otros campos a vacío
      }
    });

    // 2. Habilitar y añadir validadores para los campos del rol seleccionado.
    if (roleName === 'cliente') {
      this.userForm.get('direccionCliente')?.enable();
      this.userForm.get('direccionCliente')?.setValidators(Validators.required); // Dirección obligatoria para cliente
      this.userForm.get('fechaNacimientoCliente')?.enable();
      this.userForm.get('preferenciasAlimentariasCliente')?.enable();
      this.userForm.get('puntosCliente')?.enable();
    } else if (roleName === 'repartidor') {
      this.userForm.get('vehiculoRepartidor')?.enable();
      this.userForm.get('vehiculoRepartidor')?.setValidators(Validators.required); // Vehículo obligatorio para repartidor
      this.userForm.get('numeroLicenciaRepartidor')?.enable();
      this.userForm.get('numeroLicenciaRepartidor')?.setValidators(Validators.required); // Licencia obligatoria para repartidor
    }

    // 3. Actualizar la validez del formulario después de cambiar validadores
    this.userForm.updateValueAndValidity();
  }

  onSubmit(): void {
    // No necesitamos errorMessage/successMessage como propiedades del componente
    // si usamos Toastr para mostrarlos.

    // Habilitar temporalmente los campos específicos del rol para que sus valores
    // se incluyan en `userForm.value` antes de la validación final y el envío.
    // Esto es crucial porque `userForm.value` solo incluye controles habilitados.
    const specificClientFields = ['direccionCliente', 'fechaNacimientoCliente', 'preferenciasAlimentariasCliente', 'puntosCliente'];
    const specificRepartidorFields = ['vehiculoRepartidor', 'numeroLicenciaRepartidor'];

    specificClientFields.forEach(field => this.userForm.get(field)?.enable());
    specificRepartidorFields.forEach(field => this.userForm.get(field)?.enable());


    if (this.userForm.valid) {
      const formData = this.userForm.value;
      console.log('Datos del formulario a enviar (incluyendo deshabilitados):', formData);

      let preferenciasArray: string[] | null = null;
      if (formData.preferenciasAlimentariasCliente) {
        preferenciasArray = formData.preferenciasAlimentariasCliente
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
      }

      // Construir el payload según la interfaz IRegisterUserPayload
      const registerPayload: IRegisterUserPayload = {
        username: formData.username,
        passwordHash: formData.password, // Mapea password del formulario a passwordHash para el payload
        email: formData.email,
        telefono: formData.telefono || null, // Asegura que sea null si está vacío o no se introduce
        rolName: formData.rolName,
        nombre: formData.nombre,
        apellido: formData.apellido,
        // Campos específicos de cliente (se incluyen si están presentes, el backend maneja la lógica de rol)
        direccionCliente: formData.direccionCliente || null,
        fechaNacimientoCliente: formData.fechaNacimientoCliente || null,
        preferenciasAlimentariasCliente: preferenciasArray,
        puntosCliente: formData.puntosCliente !== undefined && formData.puntosCliente !== null ? formData.puntosCliente : null,

        // Campos específicos de repartidor (se incluyen si están presentes, el backend maneja la lógica de rol)
        vehiculoRepartidor: formData.vehiculoRepartidor || null,
        numeroLicenciaRepartidor: formData.numeroLicenciaRepartidor || null,
      };

      this.authService.register(registerPayload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          const successMsg = response.mensaje || 'Usuario y perfil de rol creado exitosamente!';
          this.toastr.success(successMsg, '¡Creado!'); // <-- Usar Toastr para éxito
          console.log('Respuesta del backend:', response);
          this.userForm.reset(); // Limpiar el formulario
          this.selectedRoleName = ''; // Limpia el rol seleccionado para ocultar campos específicos
          // Resetear el estado de los controles específicos (deshabilitarlos y limpiar validadores)
          this.onRoleChange(''); // Llama a onRoleChange con un rol vacío para resetear todos los campos
          // Redirigir después de un breve retraso para que el usuario vea el mensaje de éxito
          setTimeout(() => {
            this.router.navigate(['/admin/users/manage-by-role']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear usuario y perfil:', err);
          const errorMsg = err.error?.mensaje || 'Error al crear usuario y perfil. Intente de nuevo.';
          this.toastr.error(errorMsg, 'Error'); // <-- Usar Toastr para errores
          // Después de un error, volver a deshabilitar/limpiar campos específicos si es necesario
          // Esto evita que queden habilitados si la validación del frontend falla y el usuario no cambia el rol
          this.onRoleChange(this.selectedRoleName);
        }
      });
    } else {
      const validationErrorMsg = 'Por favor, complete todos los campos requeridos y válidos.';
      this.userForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores

      // Importante: Volver a deshabilitar/limpiar campos específicos si la validación local falla
      // para que el formulario se muestre correctamente al usuario.
      this.onRoleChange(this.selectedRoleName); // Vuelve a aplicar la lógica de habilitación/deshabilitación
      this.toastr.warning(validationErrorMsg, 'Validación'); // <-- Usar Toastr para advertencias
    }
  }

  get f() { return this.userForm.controls; }
}