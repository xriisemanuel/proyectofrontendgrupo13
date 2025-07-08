// src/app/features/admin/components/admin/edit-user/edit-user.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// --- ¡IMPORTACIÓN CORRECTA Y ÚNICA DE INTERFACES! ---
import { UsuarioService } from '../../../data/services/usuario';
import { IUsuario, IRol, IClientePerfil, IRepartidor } from '../../../shared/interfaces';
// --- FIN DE IMPORTACIÓN ---

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.html',
  styleUrls: ['./edit-user.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class EditUserComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  userId: string | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;
  selectedRoleName: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private toastr: ToastrService
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      rolId: [{ value: '', disabled: true }, Validators.required],

      direccionCliente: [{ value: '', disabled: true }],
      fechaNacimientoCliente: [{ value: '', disabled: true }],
      preferenciasAlimentariasCliente: [{ value: '', disabled: true }],
      puntosCliente: [{ value: 0, disabled: true }],

      vehiculoRepartidor: [{ value: '', disabled: true }],
      numeroLicenciaRepartidor: [{ value: '', disabled: true }]
    });

    this.userForm.get('rolId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(roleId => {
      if (roleId && typeof roleId === 'object' && 'nombre' in roleId) {
        this.onRoleChange((roleId as IRol).nombre);
      } else {
        this.onRoleChange('');
      }
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUser(this.userId);
    } else {
      this.toastr.error('ID de usuario no proporcionado.', 'Error');
      this.isLoading = false;
      this.router.navigate(['/admin/users/manage-by-role']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.usuarioService.getUsuarioById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: IUsuario) => {
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          telefono: user.telefono,
          nombre: user.nombre,
          apellido: user.apellido,
          rolId: user.rolId
        });

        if (user.rolId && typeof user.rolId === 'object' && (user.rolId as IRol).nombre === 'cliente' && user.clienteId) {
          const clientePerfil = user.clienteId as IClientePerfil;
          this.userForm.patchValue({
            direccionCliente: clientePerfil.direccion,
            fechaNacimientoCliente: clientePerfil.fechaNacimiento,
            preferenciasAlimentariasCliente: clientePerfil.preferenciasAlimentarias?.join(', ') || '',
            puntosCliente: clientePerfil.puntos
          });
        } else if (user.rolId && typeof user.rolId === 'object' && (user.rolId as IRol).nombre === 'repartidor' && user.repartidorId) {
          const repartidorPerfil = user.repartidorId as IRepartidor;
          this.userForm.patchValue({
            vehiculoRepartidor: repartidorPerfil.vehiculo,
            numeroLicenciaRepartidor: repartidorPerfil.numeroLicencia
          });
        }

        this.isLoading = false;
        console.log('Usuario cargado para edición:', user);
      },
      error: (err) => {
        console.error('Error al cargar el usuario:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los detalles del usuario.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
        this.router.navigate(['/admin/users/manage-by-role']);
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

  getRoleName(rolValue: any): string {
    if (rolValue && typeof rolValue === 'object' && 'nombre' in rolValue) {
      return (rolValue as IRol).nombre;
    }
    if (typeof rolValue === 'string') {
      return 'Cargando...';
    }
    return 'Desconocido';
  }

  onSubmit(): void {
    const specificClientFields = ['direccionCliente', 'fechaNacimientoCliente', 'preferenciasAlimentariasCliente', 'puntosCliente'];
    const specificRepartidorFields = ['vehiculoRepartidor', 'numeroLicenciaRepartidor'];

    specificClientFields.forEach(field => this.userForm.get(field)?.enable());
    specificRepartidorFields.forEach(field => this.userForm.get(field)?.enable());

    if (this.userForm.valid && this.userId) {
      const formData = this.userForm.value;
      console.log('Datos del formulario a enviar (incluyendo deshabilitados):', formData);

      let preferenciasArray: string[] | null = null;
      if (formData.preferenciasAlimentariasCliente) {
        preferenciasArray = formData.preferenciasAlimentariasCliente
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0);
      }

      const updatePayload: any = {
        username: formData.username,
        email: formData.email,
        telefono: formData.telefono || null,
        nombre: formData.nombre,
        apellido: formData.apellido,

        direccionCliente: this.selectedRoleName === 'cliente' ? (formData.direccionCliente || null) : undefined,
        fechaNacimientoCliente: this.selectedRoleName === 'cliente' ? (formData.fechaNacimientoCliente || null) : undefined,
        preferenciasAlimentariasCliente: this.selectedRoleName === 'cliente' ? preferenciasArray : undefined,
        puntosCliente: this.selectedRoleName === 'cliente' ? (formData.puntosCliente !== undefined && formData.puntosCliente !== null ? formData.puntosCliente : null) : undefined,

        vehiculoRepartidor: this.selectedRoleName === 'repartidor' ? (formData.vehiculoRepartidor || null) : undefined,
        numeroLicenciaRepartidor: this.selectedRoleName === 'repartidor' ? (formData.numeroLicenciaRepartidor || null) : undefined,
      };

      this.isSaving = true;
      this.usuarioService.updateUsuario(this.userId, updatePayload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          const successMsg = response.mensaje || 'Usuario actualizado exitosamente.';
          this.toastr.success(successMsg, '¡Actualizado!');
          console.log('Respuesta del backend:', response);
          this.isSaving = false;
          setTimeout(() => {
            this.router.navigate(['/admin/users/manage-by-role']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error al actualizar usuario:', err);
          const errorMsg = err.error?.mensaje || 'Error al actualizar usuario. Intente de nuevo.';
          this.toastr.error(errorMsg, 'Error de Actualización');
          this.isSaving = false;
          this.onRoleChange(this.selectedRoleName);
        }
      });
    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.userForm.markAllAsTouched();
      this.isSaving = false;
      this.onRoleChange(this.selectedRoleName);
    }
  }

  get f() { return this.userForm.controls; }
}