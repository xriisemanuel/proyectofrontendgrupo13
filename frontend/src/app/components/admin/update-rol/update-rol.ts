import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Role } from '../../../services/role';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-rol',
  templateUrl: './update-rol.html',
  styleUrls: ['./update-rol.css'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule]
})
export class UpdateRol implements OnInit, OnDestroy {
  roleForm: FormGroup;
  roleId: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true; // Controla la visibilidad del spinner/formulario
  dataLoaded: boolean = false; // Indica si los datos del rol se cargaron exitosamente

  private destroy$ = new Subject<void>(); // Subject para desuscribirse de observables

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleService: Role
  ) {
    this.roleForm = this.fb.group({
      nombre: ['', Validators.required],
      estado: [false, Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('UpdateRolComponent: ngOnInit iniciado.'); // Depuración
    this.isLoading = true; // Inicia el estado de carga
    this.errorMessage = ''; // Limpia cualquier mensaje de error inicial
    this.successMessage = ''; // Limpia cualquier mensaje de éxito inicial
    this.dataLoaded = false; // Reinicia la bandera de datos cargados

    // Primero, intenta obtener el ID de forma síncrona usando snapshot.
    // Esto es útil para la carga inicial cuando la ruta ya está activa.
    this.roleId = this.route.snapshot.paramMap.get('id');
    console.log('UpdateRolComponent: ngOnInit - roleId de snapshot:', this.roleId); // Depuración

    if (this.roleId) {
      // Si el ID se obtiene de inmediato, carga los datos.
      this.loadRoleData(this.roleId);
    } else {
      // Si el snapshot no lo encontró (puede ocurrir en SSR o en ciertos escenarios),
      // suscríbete a paramMap para obtenerlo de forma asíncrona.
      // Esta suscripción también manejará cambios de ID si el componente se reutiliza.
      this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        this.roleId = params.get('id');
        console.log('UpdateRolComponent: paramMap subscription - roleId obtenido:', this.roleId); // Depuración

        if (this.roleId) {
          // Si se obtiene un ID válido de la suscripción, carga los datos.
          this.loadRoleData(this.roleId);
        } else {
          // Si el ID es nulo incluso después de la suscripción, establece el error final.
          this.errorMessage = 'No se proporcionó un ID de rol válido en la URL para editar.';
          this.isLoading = false; // Detiene la carga, ya que no hay ID para cargar datos
          this.dataLoaded = false; // Los datos no se cargaron
          console.log('UpdateRolComponent: Error - roleId es nulo después de la suscripción de paramMap.'); // Depuración
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRoleData(id: string): void {
    console.log('UpdateRolComponent: loadRoleData - Iniciando llamada a la API para ID:', id); // Depuración
    this.isLoading = true; // Indica carga para la llamada a la API
    this.roleService.getRoleById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (role) => {
        console.log('UpdateRolComponent: loadRoleData - Llamada a la API exitosa, rol recibido:', role); // Depuración
        this.roleForm.patchValue({
          nombre: role.nombre,
          estado: role.estado
        });
        this.isLoading = false; // Detiene la carga
        this.dataLoaded = true; // Datos cargados exitosamente
        this.errorMessage = ''; // Limpia cualquier mensaje de error previo al cargar datos
        console.log('UpdateRolComponent: Datos del rol cargados para edición y formulario parchado.');
      },
      error: (err) => {
        console.error('UpdateRolComponent: loadRoleData - Falló la llamada a la API, error:', err); // Depuración
        this.errorMessage = err.error?.mensaje || 'Error al cargar los datos del rol. El rol podría no existir o no tener permisos.';
        this.isLoading = false; // Detiene la carga
        this.dataLoaded = false; // Los datos no se cargaron
        // Opcionalmente redirigir si el rol no existe o hay un error crítico (ej. 404 Not Found)
        // if (err.status === 404) {
        //   this.router.navigate(['/admin/roles/manage']);
        // }
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Procede solo si el formulario es válido, roleId está presente Y los datos se cargaron exitosamente
    if (this.roleForm.valid && this.roleId && this.dataLoaded) {
      const updatedRoleData = this.roleForm.value;
      console.log('UpdateRolComponent: onSubmit - Intentando actualizar rol:', updatedRoleData);

      this.roleService.updateRole(this.roleId, updatedRoleData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Rol actualizado exitosamente!';
          console.log('UpdateRolComponent: onSubmit - Respuesta del backend:', response);
          setTimeout(() => {
            this.router.navigate(['/admin/roles/manage']);
          }, 2000);
        },
        error: (err) => {
          console.error('UpdateRolComponent: onSubmit - Error al actualizar rol:', err);
          if (err.status === 400 && err.error?.mensaje && err.error.mensaje.includes('ya está en uso')) {
            this.errorMessage = err.error.mensaje;
          } else {
            this.errorMessage = err.error?.mensaje || 'Error al actualizar el rol. Intente de nuevo.';
          }
        }
      });
    } else {
      // Este mensaje se muestra si el formulario no es válido, roleId es nulo, o los datos no se cargaron
      // Se prioriza el mensaje de datos no cargados si dataLoaded es false
      if (!this.dataLoaded) {
        this.errorMessage = 'No se pudieron cargar los datos del rol para editar. Por favor, intente de nuevo.';
      } else if (!this.roleId) {
        this.errorMessage = 'No se proporcionó un ID de rol para editar.';
      } else {
        this.errorMessage = 'Por favor, complete todos los campos requeridos.';
      }
      this.roleForm.markAllAsTouched();
      console.log('UpdateRolComponent: onSubmit - Formulario inválido, ID de rol faltante o datos no cargados.'); // Depuración
    }
  }
}
