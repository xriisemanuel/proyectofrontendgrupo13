// proyecto/frontend/src/app/modules/admin/components/create-user/create-user.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

// Importa AuthService para el registro y UsuarioService para obtener roles
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida a auth.service.ts
import { IRegisterUserPayload } from '../../../core/auth/auth.interface'; // Importa la interfaz del payload
import { UsuarioService } from '../../../data/services/usuario'; // Ruta e interfaz corregidas a usuario.service.ts
import { IRol } from '../../../shared/interfaces'; // Importa la interfaz IRol
@Component({
  selector: 'app-create-user-with-role',
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule]
})
export class CreateUserWithRoleComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  roles: IRol[] = [];
  selectedRoleName: string = '';
  isLoading: boolean = true;
  @Input() defaultRole: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService,
    private route: ActivatedRoute // <-- Agregado
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
    // Leer el parámetro de la URL si no se pasó como input
    let shouldDisableRole = false;
    if (!this.defaultRole) {
      const roleFromQuery = this.route.snapshot.queryParamMap.get('role');
      if (roleFromQuery) {
        this.defaultRole = roleFromQuery;
        shouldDisableRole = true;
      }
    } else {
      shouldDisableRole = true;
    }
    this.loadRoles();
    if (this.defaultRole) {
      this.userForm.get('rolName')?.setValue(this.defaultRole);
      this.selectedRoleName = this.defaultRole;
      this.onRoleChange(this.defaultRole);
      if (shouldDisableRole) {
        this.userForm.get('rolName')?.disable();
      }
    }
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
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }

  onRoleChange(roleName: string): void {
    this.selectedRoleName = roleName;

    const allSpecificFields = [
      'direccionCliente', 'fechaNacimientoCliente', 'preferenciasAlimentariasCliente', 'puntosCliente',
      'vehiculoRepartidor', 'numeroLicenciaRepartidor'
    ];

    allSpecificFields.forEach(field => {
      const control = this.userForm.get(field);
      control?.disable();
      control?.clearValidators();
      if (field === 'puntosCliente') {
        control?.setValue(0);
      } else {
        control?.setValue('');
      }
    });

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

    this.userForm.updateValueAndValidity();
  }

  onSubmit(): void {
    // Habilitar temporalmente los campos específicos del rol para que sus valores
    // se incluyan en `userForm.value` antes de la validación final y el envío.
    const specificClientFields = ['direccionCliente', 'fechaNacimientoCliente', 'preferenciasAlimentariasCliente', 'puntosCliente'];
    const specificRepartidorFields = ['vehiculoRepartidor', 'numeroLicenciaRepartidor'];

    specificClientFields.forEach(field => this.userForm.get(field)?.enable());
    specificRepartidorFields.forEach(field => this.userForm.get(field)?.enable());

    if (this.userForm.valid) {
      const formData = this.userForm.value;
      console.log('Datos del formulario a enviar (incluyendo deshabilitados):', formData);
      console.log('Rol seleccionado (selectedRoleName):', this.selectedRoleName);
      console.log('Rol del formulario (formData.rolName):', formData.rolName);

      let preferenciasArray: string[] | null = null;
      if (formData.preferenciasAlimentariasCliente) {
        preferenciasArray = formData.preferenciasAlimentariasCliente
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
      }

      // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
      // El backend espera 'password', no 'passwordHash'.
      // Si tu interfaz IRegisterUserPayload tiene 'passwordHash', lo mejor es cambiar la interfaz.
      // Si no puedes cambiar la interfaz ahora, puedes usar 'any' temporalmente para el payload.
      let fechaNacimientoFormateada = formData.fechaNacimientoCliente;
      if (this.selectedRoleName === 'cliente' && formData.fechaNacimientoCliente) {
        // Si la fecha viene como '2025-04-23T00:00:00.000Z', la convertimos a '2025-04-23'
        const dateObj = new Date(formData.fechaNacimientoCliente);
        if (!isNaN(dateObj.getTime())) {
          // Formato yyyy-MM-dd
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          fechaNacimientoFormateada = `${year}-${month}-${day}`;
        }
      }
      const registerPayload: any = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        telefono: formData.telefono || null,
        rolName: formData.rolName || this.selectedRoleName, // Usar selectedRoleName si formData.rolName está vacío
        nombre: formData.nombre,
        apellido: formData.apellido,
        direccionCliente: formData.direccionCliente || null,
        fechaNacimientoCliente: fechaNacimientoFormateada || null,
        preferenciasAlimentariasCliente: preferenciasArray,
        puntosCliente: formData.puntosCliente !== undefined && formData.puntosCliente !== null ? formData.puntosCliente : null,
        vehiculoRepartidor: formData.vehiculoRepartidor || null,
        numeroLicenciaRepartidor: formData.numeroLicenciaRepartidor || null,
      };

      console.log('Payload a enviar al backend:', JSON.stringify(registerPayload, null, 2));
      console.log('Rol seleccionado:', this.selectedRoleName);

      this.authService.register(registerPayload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          const successMsg = response.mensaje || 'Usuario y perfil de rol creado exitosamente!';
          this.toastr.success(successMsg, '¡Creado!');
          console.log('Respuesta del backend:', response);
          this.userForm.reset();
          this.selectedRoleName = '';
          this.onRoleChange(''); // Llama a onRoleChange con un rol vacío para resetear todos los campos
          setTimeout(() => {
            this.router.navigate(['/admin/users/manage-by-role']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al crear usuario y perfil:', err);
          console.error('Error completo:', JSON.stringify(err, null, 2));
          console.error('Error del backend:', err.error);
          const errorMsg = err.error?.mensaje || 'Error al crear usuario y perfil. Intente de nuevo.';
          this.toastr.error(errorMsg, 'Error');
          this.onRoleChange(this.selectedRoleName); // Vuelve a aplicar la lógica de habilitación/deshabilitación
        }
      });
    } else {
      const validationErrorMsg = 'Por favor, complete todos los campos requeridos y válidos.';
      this.userForm.markAllAsTouched();

      this.onRoleChange(this.selectedRoleName); // Vuelve a aplicar la lógica de habilitación/deshabilitación
      this.toastr.warning(validationErrorMsg, 'Validación');
    }
  }

  getBackLink(): string {
    switch ((this.defaultRole || '').toLowerCase()) {
      case 'cliente':
        return '/admin/clientes/manage';
      case 'repartidor':
        return '/admin/repartidores/manage';
      case 'supervisor_cocina':
        return '/admin/supervisores-cocina/manage';
      case 'supervisorventas':
        return '/admin/supervisores-ventas/manage';
      default:
        return '/admin/dashboard';
    }
  }

  get f() { return this.userForm.controls; }
}