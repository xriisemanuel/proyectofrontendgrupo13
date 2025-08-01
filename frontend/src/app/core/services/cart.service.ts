import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  tipo: 'producto' | 'oferta';
  item: any; // Producto | Oferta
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private cartTotal = new BehaviorSubject<number>(0);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loadCartFromStorage();
    }
  }

  /**
   * Obtiene los items del carrito como Observable
   */
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  /**
   * Obtiene el total del carrito como Observable
   */
  getCartTotal(): Observable<number> {
    return this.cartTotal.asObservable();
  }

  /**
   * Obtiene los items del carrito como valor actual
   */
  getCartItemsValue(): CartItem[] {
    return this.cartItems.value;
  }

  /**
   * Obtiene el total del carrito como valor actual
   */
  getCartTotalValue(): number {
    return this.cartTotal.value;
  }

  /**
   * Agrega un producto al carrito
   */
  addToCart(product: any, quantity: number = 1): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.item._id === product._id);

    if (existingItem) {
      // Si el producto ya existe, incrementar la cantidad
      existingItem.cantidad += quantity;
      this.updateCart([...currentItems]);
    } else {
      // Si es un producto nuevo, agregarlo
      const newItem: CartItem = { tipo: 'producto', item: product, cantidad: quantity };
      this.updateCart([...currentItems, newItem]);
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   */
  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const itemIndex = currentItems.findIndex(item => item.item._id === productId);

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // Si la cantidad es 0 o menor, eliminar el item
        currentItems.splice(itemIndex, 1);
      } else {
        // Actualizar la cantidad
        currentItems[itemIndex].cantidad = quantity;
      }
      this.updateCart([...currentItems]);
    }
  }

  /**
   * Elimina un producto del carrito
   */
  removeFromCart(productId: string): void {
    const currentItems = this.cartItems.value;
    const filteredItems = currentItems.filter(item => item.item._id !== productId);
    this.updateCart(filteredItems);
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    this.updateCart([]);
  }

  /**
   * Obtiene la cantidad de un producto específico en el carrito
   */
  getItemQuantity(productId: string): number {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(item => item.item._id === productId);
    return item ? item.cantidad : 0;
  }

  /**
   * Obtiene el número total de items en el carrito
   */
  getTotalItems(): number {
    const currentItems = this.cartItems.value;
    return currentItems.reduce((total, item) => total + item.cantidad, 0);
  }

  /**
   * Actualiza el carrito y calcula el total
   */
  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    this.calculateTotal(items);
    this.saveCartToStorage(items);
  }

  /**
   * Calcula el total del carrito
   */
  private calculateTotal(items: CartItem[]): void {
    const total = items.reduce((sum, item) => {
      const price = item.item.precio || item.item.precioCombo || item.item.precioFinal || 0;
      return sum + (price * item.cantidad);
    }, 0);
    this.cartTotal.next(total);
  }

  /**
   * Guarda el carrito en localStorage
   */
  private saveCartToStorage(items: CartItem[]): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  /**
   * Carga el carrito desde localStorage
   */
  private loadCartFromStorage(): void {
    if (!this.isBrowser) return;
    
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const items: CartItem[] = JSON.parse(storedCart);
        this.updateCart(items);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.updateCart([]);
    }
  }

  /**
   * Verifica si el carrito está vacío
   */
  isCartEmpty(): boolean {
    return this.cartItems.value.length === 0;
  }

  /**
   * Obtiene un resumen del carrito
   */
  getCartSummary(): { totalItems: number; totalPrice: number; itemCount: number } {
    const items = this.cartItems.value;
    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrice = items.reduce((sum, item) => {
      const price = item.item.precio || item.item.precioCombo || item.item.precioFinal || 0;
      return sum + (price * item.cantidad);
    }, 0);
    const itemCount = items.length;

    return { totalItems, totalPrice, itemCount };
  }

  updateItemQuantity(tipo: 'producto' | 'oferta', id: string, cantidad: number) {
    const idx = this.cartItems.value.findIndex(i => i.tipo === tipo && i.item._id === id);
    if (idx > -1) {
      this.cartItems.value[idx].cantidad = cantidad;
      this.updateCart(this.cartItems.value);
    }
  }
} 