import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/auth/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  totalItems: number = 0;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado y es cliente
    if (!this.authService.isAuthenticated()) {
      this.toastr.warning('Debes iniciar sesión para acceder al carrito', 'Acceso requerido');
      this.router.navigate(['/login']);
      return;
    }

    const userRole = this.authService.getRole();
    if (userRole !== 'cliente') {
      this.toastr.error('Solo los clientes pueden acceder al carrito', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }

    // Suscribirse a cambios en el carrito
    this.cartService.getCartItems().pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.cartItems = items;
      this.totalItems = this.cartService.getTotalItems();
    });

    this.cartService.getCartTotal().pipe(
      takeUntil(this.destroy$)
    ).subscribe(total => {
      this.cartTotal = total;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza la cantidad de un producto
   */
  updateQuantity(item: CartItem, cantidad: number): void {
    if (cantidad < 1) {
      this.removeItem(item);
      return;
    }
    
    // Actualiza la cantidad en el array
    const idx = this.cartItems.findIndex(i => i.tipo === item.tipo && i.item._id === item.item._id);
    if (idx > -1) {
      this.cartItems[idx].cantidad = cantidad;
      this.cartService.updateItemQuantity(item.tipo, item.item._id, cantidad);
      // No necesitas actualizar manualmente cartItems, el subscribe lo hace
    }
  }

  /**
   * Elimina un producto del carrito
   */
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.item._id);
    // No necesitas actualizar manualmente cartItems, el subscribe lo hace
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    this.cartService.clearCart();
    this.toastr.success('Carrito vaciado', 'Carrito actualizado');
  }

  /**
   * Continúa comprando
   */
  continueShopping(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Procede al checkout
   */
  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('El carrito está vacío', 'Carrito vacío');
      return;
    }
    
    this.router.navigate(['/checkout']);
  }

  /**
   * Obtiene el precio de un producto
   */
  getProductPrice(product: any): number {
    return product.precio || product.precioCombo || product.precioFinal || 0;
  }

  /**
   * Obtiene el precio total de un item
   */
  getItemTotal(item: CartItem): number {
    const price = this.getProductPrice(item.item);
    return price * item.cantidad;
  }

  /**
   * Verifica si el carrito está vacío
   */
  isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * TrackBy function para optimizar el rendimiento del ngFor
   */
  trackByProductId(index: number, item: CartItem): string {
    return item.item._id;
  }

  getItemName(item: CartItem) {
    // Si es producto, usa nombre; si es oferta, usa titulo
    return item.tipo === 'producto' ? item.item.nombre : item.item.titulo;
  }

  getItemPrice(item: CartItem): number {
    // Si es producto, usa precio; si es oferta, usa precioCombo o precioFinal
    if (item.tipo === 'producto') {
      return item.item.precio || 0;
    } else {
      return item.item.precioCombo || item.item.precioFinal || 0;
    }
  }
} 