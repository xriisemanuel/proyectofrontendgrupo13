import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  mensaje: string = '';
  registrado: boolean = false;
  roles = ['admin', 'cliente', 'supervisor_cocina', 'supervisor_ventas', 'repartidor'];

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      rolName: ['cliente', Validators.required],
      direccionCliente: ['']
    });

    this.registerForm.get('rolName')?.valueChanges.subscribe(rol => {
      const direccionControl = this.registerForm.get('direccionCliente');
      if (rol === 'cliente') {
        direccionControl?.setValidators([Validators.required]);
      } else {
        direccionControl?.clearValidators();
      }
      direccionControl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.mensaje = 'Usuario registrado correctamente. Ahora puedes iniciar sesión.';
          this.registrado = true;
          this.registerForm.reset({ rolName: 'cliente' });
        },
        error: (err: any) => {
          this.mensaje = err.error?.mensaje || 'Error al registrar usuario.';
        }
      });
    }
  }

  isDireccionRequired(): boolean {
    return this.registerForm.get('rolName')?.value === 'cliente';
  }
}
