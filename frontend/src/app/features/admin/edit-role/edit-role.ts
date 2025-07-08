// src/app/features/admin/components/admin/edit-role/edit-role.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModule
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // RouterLink
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { UsuarioService } from '../../../data/services/usuario';
import { IRol } from '../../../shared/interfaces';

@Component({
  selector: 'app-edit-role',
  templateUrl: './edit-role.html',
  styleUrls: ['./edit-role.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink] // <--- ¡AÑADIDO ReactiveFormsModule y RouterLink!
})
export class EditRoleComponent implements OnInit, OnDestroy {
  roleForm: FormGroup;
  roleId: string | null = null;
  isLoading: boolean = true;
  isSaving: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, // Inyección de FormBuilder
    private route: ActivatedRoute,
    private router: Router, // Inyección de Router
    private usuarioService: UsuarioService,
    private toastr: ToastrService
  ) {
    this.roleForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      estado: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    if (this.roleId) {
      this.loadRole(this.roleId);
    } else {
      this.toastr.error('ID de rol no proporcionado.', 'Error');
      this.isLoading = false;
      this.router.navigate(['/admin/roles/manage']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRole(id: string): void {
    this.isLoading = true;
    this.usuarioService.getRolById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (role: IRol) => {
        this.roleForm.patchValue(role);
        this.isLoading = false;
        console.log('Rol cargado para edición:', role);
      },
      error: (err) => {
        console.error('Error al cargar el rol:', err);
        const errorMessage = err.error?.mensaje || 'Error al cargar los detalles del rol.';
        this.toastr.error(errorMessage, 'Error de Carga');
        this.isLoading = false;
        this.router.navigate(['/admin/roles/manage']);
      }
    });
  }

  onSubmit(): void {
    this.isSaving = true;
    if (this.roleForm.valid && this.roleId) {
      const updatedRoleData: Partial<IRol> = this.roleForm.value;
      console.log('Enviando datos de actualización del rol:', updatedRoleData);

      this.usuarioService.updateRol(this.roleId, updatedRoleData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          const successMsg = response.mensaje || 'Rol actualizado exitosamente.';
          this.toastr.success(successMsg, '¡Actualizado!');
          console.log('Respuesta del backend:', response);
          this.isSaving = false;
          setTimeout(() => {
            this.router.navigate(['/admin/roles/manage']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error al actualizar el rol:', err);
          const errorMsg = err.error?.mensaje || 'Error al actualizar el rol. Intente de nuevo.';
          this.toastr.error(errorMsg, 'Error de Actualización');
          this.isSaving = false;
        }
      });
    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.roleForm.markAllAsTouched();
      this.isSaving = false;
    }
  }

  get f() { return this.roleForm.controls; }
}