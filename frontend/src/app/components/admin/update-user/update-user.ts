import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Importa IUsuario, IRol, IClientePerfil, IRepartidorPerfil
import { UsuarioService, IUsuario, IRol, IClientePerfil, IRepartidorPerfil } from '../../../services/usuario';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.html',
  styleUrls: ['./update-user.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule]
})
export class UpdateUserComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  userId: string | null = null;
  userData: IUsuario | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true;
  dataLoaded: boolean = false;
  userRole: string = ''; // Para almacenar el nombre del rol del usuario

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    // Inicialización del formulario con campos comunes a todos los usuarios
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''],
      estado: [false, Validators.required],
      // Campos específicos de Cliente (se añadirán o se mostrarán condicionalmente)
      direccionCliente: [''],
      fechaNacimientoCliente: [''],
      preferenciasAlimentariasCliente: [[]],
      puntosCliente: [0],
      // Campos específicos de Repartidor (se añadirán o se mostrarán condicionalmente)
      vehiculoRepartidor: [''],
      numeroLicenciaRepartidor: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      this.loadUserData(this.userId);
    } else {
      this.errorMessage = 'No se proporcionó un ID de usuario para editar.';
      this.isLoading = false;
      this.dataLoaded = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del usuario desde el backend y configura el formulario dinámicamente.
   * @param id El ID del usuario a cargar.
   */
  loadUserData(id: string): void {
    this.isLoading = true;
    this.usuarioService.getUsuarioById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: IUsuario) => {
        this.userData = user;
        if (this.userData.rolId && this.userData.rolId.nombre) {
          this.userRole = this.userData.rolId.nombre;
          console.log('Rol del usuario:', this.userRole);

          // Rellenar campos comunes
          this.userForm.patchValue({
            username: user.username,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono,
            estado: user.estado
          });

          // Rellenar campos específicos según el rol, accediendo a las propiedades anidadas
          switch (this.userRole) {
            case 'cliente':
              this.userForm.patchValue({
                direccionCliente: user.clienteId?.direccion || '',
                fechaNacimientoCliente: user.clienteId?.fechaNacimiento ? this.formatDateForInput(user.clienteId.fechaNacimiento) : '',
                preferenciasAlimentariasCliente: user.clienteId?.preferenciasAlimentarias || [],
                puntosCliente: user.clienteId?.puntos || 0
              });
              break;
            case 'repartidor':
              this.userForm.patchValue({
                vehiculoRepartidor: user.repartidorId?.vehiculo || '',
                numeroLicenciaRepartidor: user.repartidorId?.numeroLicencia || ''
              });
              break;
            // Para 'admin', 'supervisor_cocina', 'supervisor_ventas', solo los campos comunes son relevantes.
          }
          this.isLoading = false;
          this.dataLoaded = true;
          console.log('Datos del usuario cargados:', user);
        } else {
          this.errorMessage = 'El usuario no tiene un rol válido o no existe.';
          this.isLoading = false;
          this.dataLoaded = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los datos del usuario.';
        this.isLoading = false;
        this.dataLoaded = false;
      }
    });
  }

  /**
   * Formatea una fecha para que sea compatible con input type="date".
   * @param dateString La cadena de fecha a formatear.
   * @returns La fecha formateada como 'YYYY-MM-DD'.
   */
  formatDateForInput(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Envía los cambios del formulario al backend para actualizar el usuario.
   */
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.userForm.valid && this.userId && this.dataLoaded) {
      const formValues = this.userForm.value;
      // Construir el objeto de datos a enviar, incluyendo solo los campos relevantes
      const updatedUserData: any = {
        username: formValues.username,
        email: formValues.email,
        nombre: formValues.nombre,
        apellido: formValues.apellido,
        telefono: formValues.telefono,
        estado: formValues.estado,
      };

      // Añadir campos específicos según el rol
      switch (this.userRole) {
        case 'cliente':
          updatedUserData.direccionCliente = formValues.direccionCliente;
          updatedUserData.fechaNacimientoCliente = formValues.fechaNacimientoCliente;
          updatedUserData.preferenciasAlimentariasCliente = Array.isArray(formValues.preferenciasAlimentariasCliente)
            ? formValues.preferenciasAlimentariasCliente
            : (formValues.preferenciasAlimentariasCliente ? formValues.preferenciasAlimentariasCliente.split(',').map((s: string) => s.trim()).filter((s: string) => s) : []);
          updatedUserData.puntosCliente = formValues.puntosCliente;
          break;
        case 'repartidor':
          updatedUserData.vehiculoRepartidor = formValues.vehiculoRepartidor;
          updatedUserData.numeroLicenciaRepartidor = formValues.numeroLicenciaRepartidor;
          break;
      }

      console.log('Intentando actualizar usuario:', updatedUserData);

      this.usuarioService.updateUsuario(this.userId, updatedUserData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Usuario actualizado exitosamente!';
          Swal.fire('¡Actualizado!', this.successMessage, 'success');
          console.log('Respuesta del backend:', response);
          setTimeout(() => {
            // Redirigir de vuelta a la gestión por rol o a la lista específica
            if (this.userRole === 'cliente') {
              this.router.navigate(['/admin/clientes/manage']);
            } else if (this.userRole === 'repartidor') {
              this.router.navigate(['/admin/repartidores/manage']);
            } else if (this.userRole === 'supervisor_cocina') {
              this.router.navigate(['/admin/supervisores-cocina/manage']);
            } else if (this.userRole === 'supervisor_ventas') {
              this.router.navigate(['/admin/supervisores-ventas/manage']); // Futura ruta
            } else {
              this.router.navigate(['/admin/users/manage-by-role']); // O una ruta genérica
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Error al actualizar el usuario:', err);
          this.errorMessage = err.error?.mensaje || 'Error al actualizar el usuario. Intente de nuevo.';
          Swal.fire('Error', this.errorMessage, 'error');
        }
      });
    } else {
      this.errorMessage = 'Por favor, complete todos los campos requeridos o el ID de usuario no es válido.';
      this.userForm.markAllAsTouched();
    }
  }

  // Getter para facilitar el acceso a los controles del formulario en el HTML
  get f() { return this.userForm.controls; }
}
