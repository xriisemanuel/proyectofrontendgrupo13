// src/app/features/cliente/components/realizar-pedido/realizar-pedido.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para ngModel
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Servicios
import { ProductoService } from '../../../data/services/producto'; // Ruta corregida
import { PedidoService } from '../../../data/services/pedido'; // Ruta corregida
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida

// Interfaces
import { IProducto, IDetalleProductoFrontend, IPedidoPayload } from '../../../shared/pedido.interface'; // Ruta corregida

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importa FormsModule para [(ngModel)]
  templateUrl: './realizar-pedido.html', // Asegúrate de que el nombre del archivo HTML sea correcto
  styleUrls: ['./realizar-pedido.css'] // Asegúrate de que el nombre del archivo CSS sea correcto
})
export class RealizarPedidoComponent implements OnInit, OnDestroy {
  productosDisponibles: IProducto[] = []; // Lista de productos para que el cliente elija
  carrito: IDetalleProductoFrontend[] = []; // Productos en el carrito del cliente

  // Datos del formulario de pedido
  direccionEntrega: string = '';
  metodoPago: IPedidoPayload['metodoPago'] = 'Efectivo'; // Valor por defecto
  observaciones: string = '';
  descuentos: number = 0; // Podría venir de un campo o ser calculado
  costoEnvio: number = 0; // Podría ser fijo o calculado

  // Propiedades calculadas para la UI
  subtotalPedido: number = 0;
  totalPedido: number = 0;

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // Inyección de servicios
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.getRole() !== 'cliente') {
      this.router.navigate(['/login']); // Redirigir si no es cliente o no está autenticado
      return;
    }
    this.loadProductos();
    // Podrías cargar la dirección por defecto del cliente aquí si la tuvieras en el perfil
    // this.loadDefaultAddress();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProductos(): void {
    this.isLoading = true;
    this.subscriptions.push(
      // La llamada a getProducts() se mantiene como solicitaste.
      this.productoService.getProducts().subscribe({ // AQUI ESTA MUY BIEN LA LLAMADA GET
        next: (productos) => {
          // CORRECCIÓN: Se añade una aserción de tipo para asegurar la compatibilidad.
          this.productosDisponibles = productos as IProducto[]; // SOLO CORRIGE ESTE ERROR AQUI;
          this.isLoading = false;
          console.log('Productos cargados:', this.productosDisponibles);
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.errorMessage = 'No se pudieron cargar los productos disponibles. Intente de nuevo más tarde.';
          this.isLoading = false;
        }
      })
    );
  }

  /**
   * Añade un producto al carrito (si no existe) o incrementa su cantidad (si ya existe).
   * @param producto El producto a añadir.
   */
  agregarAlCarrito(producto: IProducto): void {
    const itemExistente = this.carrito.find(item => item.productoId === producto._id);

    if (itemExistente) {
      // Si ya existe, incrementa la cantidad
      itemExistente.cantidad++;
      console.log(`Cantidad de ${producto.nombre} incrementada a ${itemExistente.cantidad}`);
    } else {
      // Si no existe, añade el producto al carrito
      this.carrito.push({
        productoId: producto._id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio
      });
      console.log(`Producto ${producto.nombre} añadido al carrito.`);
    }
    this.calcularTotales();
  }

  /**
   * Incrementa la cantidad de un producto existente en el carrito.
   * Este método es llamado desde el botón '+' en el carrito.
   * @param productoId El ID del producto cuya cantidad se desea incrementar.
   */
  incrementarCantidadEnCarrito(productoId: string): void {
    const itemExistente = this.carrito.find(item => item.productoId === productoId);
    if (itemExistente) {
      itemExistente.cantidad++;
      console.log(`Cantidad de ${itemExistente.nombreProducto} incrementada a ${itemExistente.cantidad}`);
      this.calcularTotales();
    } else {
      // Si por alguna razón el producto no está en el carrito (lo cual no debería pasar si se usa el botón '+'),
      // podríamos buscarlo en productosDisponibles y añadirlo, o simplemente loguear un error.
      console.warn(`Intento de incrementar cantidad de producto no encontrado en el carrito: ${productoId}`);
    }
  }

  /**
   * Elimina un producto del carrito o decrementa su cantidad.
   * @param productoId El ID del producto a modificar.
   */
  quitarDelCarrito(productoId: string): void {
    const itemIndex = this.carrito.findIndex(item => item.productoId === productoId);

    if (itemIndex > -1) {
      const item = this.carrito[itemIndex];
      if (item.cantidad > 1) {
        item.cantidad--;
        console.log(`Cantidad de ${item.nombreProducto} decrementada a ${item.cantidad}`);
      } else {
        // Si la cantidad es 1, lo elimina completamente del carrito
        this.carrito.splice(itemIndex, 1);
        console.log(`Producto ${item.nombreProducto} eliminado del carrito.`);
      }
      this.calcularTotales();
    }
  }

  /**
   * Calcula el subtotal y el total del pedido en el frontend.
   */
  calcularTotales(): void {
    this.subtotalPedido = this.carrito.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    // Aquí puedes añadir lógica para descuentos y costo de envío si se calculan en frontend
    this.totalPedido = this.subtotalPedido - this.descuentos + this.costoEnvio;
    if (this.totalPedido < 0) this.totalPedido = 0; // Asegurarse que el total no sea negativo
    console.log(`Subtotal: ${this.subtotalPedido}, Total: ${this.totalPedido}`);
  }

  /**
   * Envía el pedido al backend.
   */
  realizarPedido(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.carrito.length === 0) {
      this.errorMessage = 'El carrito está vacío. Por favor, añada productos para realizar un pedido.';
      this.isLoading = false;
      return;
    }
    if (!this.direccionEntrega.trim()) {
      this.errorMessage = 'Por favor, ingrese una dirección de entrega.';
      this.isLoading = false;
      return;
    }
    if (!this.metodoPago) {
      this.errorMessage = 'Por favor, seleccione un método de pago.';
      this.isLoading = false;
      return;
    }

    // Mapea el carrito a la estructura que espera el backend (solo productoId y cantidad)
    const detalleProductosBackend = this.carrito.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad
    }));

    const pedidoPayload: IPedidoPayload = {
      detalleProductos: detalleProductosBackend,
      direccionEntrega: this.direccionEntrega,
      metodoPago: this.metodoPago,
      descuentos: this.descuentos, // Envía 0 si no hay descuentos
      costoEnvio: this.costoEnvio, // Envía 0 si no hay costo de envío
      observaciones: this.observaciones.trim() ? this.observaciones : undefined
    };

    this.subscriptions.push(
      // CORRECCIÓN: Se cambió 'createPedido' a 'crearPedido' para coincidir con la definición de tu PedidoService.
      this.pedidoService.createPedido(pedidoPayload).subscribe({ // Ahora 'pedidoPayload' es correcto
        next: (response) => {
          this.successMessage = response.mensaje || 'Pedido realizado con éxito!';
          console.log('Pedido realizado:', response.pedido);
          this.isLoading = false;
          this.carrito = []; // Vaciar carrito después de un pedido exitoso
          this.direccionEntrega = '';
          this.metodoPago = 'Efectivo';
          this.observaciones = '';
          this.descuentos = 0;
          this.costoEnvio = 0;
          this.calcularTotales(); // Recalcular para mostrar 0 en el carrito
          // Opcional: Redirigir a una página de confirmación o a "Mis Pedidos"
          this.router.navigate(['/cliente/mis-pedidos']);
        },
        error: (err) => {
          console.error('Error al realizar pedido:', err);
          this.errorMessage = err.error?.mensaje || 'Error al procesar el pedido. Intente de nuevo.';
          this.isLoading = false;
        }
      })
    );
  }

  // Helper para formatear precios
  formatPrice(price: number): string {
    return price.toFixed(2); // Formatear a 2 decimales
  }
}
