// src/app/features/admin/components/admin/add-role/add-role.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { IRol } from '../../../shared/interfaces';
import { RolService } from '../../../data/services/role'; // Asegúrate de que esta ruta sea correcta

@Component({
  selector: 'app-add-role',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './add-role.html',
  styleUrl: './add-role.css',
  standalone: true
})

export class AddRole implements OnInit, OnDestroy {
  roleForm: FormGroup;
  isSaving: boolean = false;
  errorMessage: string | null = null; // Añadido para mensajes de error en el HTML
  successMessage: string | null = null; // Añadido para mensajes de éxito en el HTML

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private rolService: RolService,
    private toastr: ToastrService
  ) {
    this.roleForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      estado: [true, Validators.required]
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    // Limpiar mensajes anteriores al intentar guardar
    this.errorMessage = null;
    this.successMessage = null;

    if (this.roleForm.valid) {
      this.isSaving = true;
      const newRoleData: Partial<IRol> = this.roleForm.value;

      console.log('Intentando crear rol:', newRoleData);

      this.rolService.createRole(newRoleData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Rol creado exitosamente!';
          this.toastr.success('¡Éxito!');
          this.roleForm.reset({ nombre: '', estado: true });
          console.log('Respuesta del backend:', response);
          this.isSaving = false;
          setTimeout(() => {
            this.router.navigate(['/admin/roles/manage']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error al crear el rol:', err);
          this.errorMessage = err.error?.mensaje || 'Error al crear el rol. Por favor, intente de nuevo.';
          this.toastr.error('Error');
          this.isSaving = false;
        }
      });

    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.roleForm.markAllAsTouched();
      this.isSaving = false; // Asegurarse de que isSaving se resetee si el formulario es inválido
    }
  }

  get f() { return this.roleForm.controls; }
}
