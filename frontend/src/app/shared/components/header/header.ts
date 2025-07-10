import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  isAuthenticated = false;
  userRole: string | null = null;
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en el estado de autenticación
    this.authService.currentUser.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.userRole = this.authService.getRole();
        this.userName = user.usuario?.nombre || user.usuario?.username || '';
      } else {
        this.userRole = null;
        this.userName = '';
      }
    });
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }

  onProfileClick(): void {
    // Navegar al perfil según el rol del usuario
    if (this.userRole) {
      switch (this.userRole.toLowerCase()) {
        case 'admin':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'cliente':
          this.router.navigate(['/client/dashboard']);
          break;
        case 'repartidor':
          this.router.navigate(['/delivery/dashboard']);
          break;
        case 'supervisor_ventas':
        case 'supervisor_cocina':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
