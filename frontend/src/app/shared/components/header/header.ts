import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';
import { CartService } from '../../../core/services/cart.service';

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
  cartItemCount: number = 0;
  cartTotal: number = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
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

    // Suscribirse a cambios en el carrito
    this.cartService.getCartItems().subscribe(items => {
      this.cartItemCount = this.cartService.getTotalItems();
    });

    this.cartService.getCartTotal().subscribe(total => {
      this.cartTotal = total;
    });
  }

  /**
   * Verifica si el usuario es un cliente
   */
  isCliente(): boolean {
    return this.userRole === 'cliente';
  }

  /**
   * Verifica si el usuario es admin, supervisor o repartidor
   */
  isStaff(): boolean {
    return ['admin', 'supervisor_ventas', 'supervisor_cocina', 'repartidor'].includes(this.userRole || '');
  }

  /**
   * Verifica si se deben mostrar los botones de navegación principal
   */
  showMainNav(): boolean {
    return !this.isAuthenticated || this.isCliente();
  }

  /**
   * Verifica si se debe mostrar el botón de carrito
   */
  showCartButton(): boolean {
    return this.isAuthenticated && this.isCliente();
  }

  /**
   * Navega al carrito de compras
   */
  onCartClick(): void {
    this.router.navigate(['/cart']);
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
          this.router.navigate(['/client/profile']);
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

  goToClientProfile(): void {
    this.router.navigate(['/client/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
