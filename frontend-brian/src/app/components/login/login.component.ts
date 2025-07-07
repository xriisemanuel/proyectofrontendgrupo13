import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RoleService, Role } from '../../services/role.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string = '';
  availableRoles: Role[] = [];

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private roleService: RoleService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Cargar roles disponibles (ahora son estáticos)
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(role => role.estado);
      },
      error: (error) => {
        // No mostrar error en consola, usar roles por defecto
        this.availableRoles = [
          { _id: '1', nombre: 'cliente', estado: true },
          { _id: '2', nombre: 'admin', estado: true },
          { _id: '3', nombre: 'supervisor_cocina', estado: true },
          { _id: '4', nombre: 'supervisor_ventas', estado: true },
          { _id: '5', nombre: 'repartidor', estado: true }
        ];
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          window.location.reload();
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.error = error.error?.mensaje || 'Error al iniciar sesión';
        }
      });
    }
  }
}
