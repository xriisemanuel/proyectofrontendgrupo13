// src/app/features/admin/components/admin/add-role/add-role.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Importa ReactiveFormsModule
import { Router, RouterLink } from '@angular/router'; // Importa RouterLink
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { IRol } from '../../../shared/interfaces';
import { RolService } from '../../../data/services/role';

@Component({
  selector: 'app-add-role',
  imports: [ReactiveFormsModule, CommonModule, RouterLink], // <--- ¡Asegurado aquí!
  templateUrl: './add-role.html',
  styleUrl: './add-role.css',
  standalone: true
})

export class AddRole implements OnInit, OnDestroy {
  roleForm: FormGroup;
  isSaving: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, // Inyección de FormBuilder
    private router: Router, // Inyección de Router
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
    if (this.roleForm.valid) {
      this.isSaving = true;
      const newRoleData: Partial<IRol> = this.roleForm.value;

      console.log('Intentando crear rol:', newRoleData);

      this.rolService.createRole(newRoleData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          const successMsg = response.mensaje || 'Rol creado exitosamente!';
          this.toastr.success(successMsg, '¡Éxito!');
          this.roleForm.reset({ nombre: '', estado: true });
          console.log('Respuesta del backend:', response);
          this.isSaving = false;
          setTimeout(() => {
            this.router.navigate(['/admin/roles/manage']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error al crear el rol:', err);
          const errorMsg = err.error?.mensaje || 'Error al crear el rol. Por favor, intente de nuevo.';
          this.toastr.error(errorMsg, 'Error');
          this.isSaving = false;
        }
      });

    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos y válidos.', 'Validación');
      this.roleForm.markAllAsTouched();
    }
  }

  get f() { return this.roleForm.controls; }
}