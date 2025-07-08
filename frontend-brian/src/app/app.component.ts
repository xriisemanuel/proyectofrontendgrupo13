import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ComboFormComponent } from './components/combo-form/combo-form.component';
import { ComboListComponent } from './components/combo-list/combo-list.component';
import { OfertaFormComponent } from './components/oferta-form/oferta-form.component';
import { OfertaListComponent } from './components/oferta-list/oferta-list.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthService } from './services/auth.service';
import { RoleService, UserRole } from './services/role.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ReactiveFormsModule,
    ComboFormComponent,
    ComboListComponent,
    OfertaFormComponent,
    OfertaListComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend-brian';
  
  /** Estado de autenticación del usuario */
  isLoggedIn: boolean = false;
  
  /** Rol actual del usuario */
  currentRole: UserRole = 'cliente';
  
  constructor(
    public authService: AuthService,
    private roleService: RoleService
  ) {}
  
  ngOnInit() {
    // Verificar si el usuario está autenticado al cargar la aplicación
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentRole = this.authService.getCurrentRole();
    
    // Suscribirse a cambios en el estado de autenticación
    this.roleService.currentRole$.subscribe((role: UserRole) => {
      this.currentRole = role;
      this.isLoggedIn = this.authService.isLoggedIn();
    });
  }
  
  /**
   * Cierra la sesión del usuario
   */
  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
