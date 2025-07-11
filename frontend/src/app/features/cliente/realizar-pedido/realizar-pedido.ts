// src/app/features/cliente/components/realizar-pedido/realizar-pedido.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para ngModel
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Servicios
import { ProductoService } from '../../../data/services/producto'; // Ruta corregida
import { PedidoService } from '../../../data/services/pedido'; // Ruta corregida
import { AuthService } from '../../../core/auth/auth'; // Ruta corregida
import { CategoriaService } from '../../../data/services/categoria'; // Servicio de categorías

// Interfaces
import { IProducto, IDetalleProductoFrontend, IPedidoPayload } from '../../../shared/pedido.interface'; // Ruta corregida
import { ICategoria } from '../../../shared/interfaces'; // Interfaz de categorías

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importa FormsModule para [(ngModel)]
  templateUrl: './realizar-pedido.html', // Asegúrate de que el nombre del archivo HTML sea correcto
  styleUrls: ['./realizar-pedido.css'] // Asegúrate de que el nombre del archivo CSS sea correcto
})
export class RealizarPedidoComponent implements OnInit, OnDestroy {
  productosDisponibles: IProducto[] = []; // Lista de productos para que el cliente elija
  productosFiltrados: IProducto[] = []; // Productos filtrados por búsqueda
  carrito: IDetalleProductoFrontend[] = []; // Productos en el carrito del cliente
  searchTerm: string = ''; // Término de búsqueda
  selectedCategoria: string = ''; // Categoría seleccionada para filtrar
  categorias: ICategoria[] = []; // Lista de categorías disponibles
  private searchTimeout: any; // Para debounce del buscador

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

  // Propiedades para el modal de confirmación
  showCartModal: boolean = false;
  addedProduct: IProducto | null = null;
  addedProductQuantity: number = 0;

  // Propiedad para controlar si se está mostrando un producto específico
  isShowingSpecificProduct: boolean = false;

  // Inyección de servicios
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || this.authService.getRole() !== 'cliente') {
      this.router.navigate(['/login']); // Redirigir si no es cliente o no está autenticado
      return;
    }
    this.loadProductos();
    this.loadCategorias();
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
          this.productosFiltrados = [...this.productosDisponibles]; // Inicializar productos filtrados
          this.isLoading = false;
          console.log('Productos cargados:', this.productosDisponibles);
          console.log('Ejemplo de producto:', this.productosDisponibles[0]);
          // Manejar query params después de cargar los productos
          this.handleQueryParams();
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.errorMessage = 'No se pudieron cargar los productos disponibles. Intente de nuevo más tarde.';
          this.isLoading = false;
        }
      })
    );
  }

  loadCategorias(): void {
    this.subscriptions.push(
      this.categoriaService.getCategorias(true).subscribe({ // Solo categorías activas
        next: (categorias) => {
          this.categorias = categorias;
          console.log('Categorías cargadas:', this.categorias.length);
          console.log('Ejemplo de categoría:', this.categorias[0]);
          
          // Si no hay categorías, mostrar todos los productos sin filtro
          if (categorias.length === 0) {
            console.log('No hay categorías disponibles, mostrando todos los productos');
          }
        },
        error: (err) => {
          console.error('Error al cargar categorías:', err);
          // No mostrar error al usuario ya que no es crítico para la funcionalidad
        }
      })
    );
  }

  /**
   * Maneja los parámetros de query para agregar productos específicos al carrito.
   */
  handleQueryParams(): void {
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        const productId = params['productId'];
        const quantity = params['quantity'] ? parseInt(params['quantity']) : 1;
        const categoriaId = params['categoriaId'];

        if (productId && this.productosDisponibles.length > 0) {
          // Buscar el producto en la lista de productos disponibles
          const producto = this.productosDisponibles.find(p => p._id === productId);
          if (producto) {
            // Si viene un productId específico, filtrar para mostrar solo ese producto
            this.productosFiltrados = [producto];
            this.isShowingSpecificProduct = true;
            console.log(`Filtrado para mostrar solo el producto: ${producto.nombre}`);
            
            // Agregar el producto al carrito con la cantidad especificada
            this.carrito.push({
              productoId: producto._id,
              nombreProducto: producto.nombre,
              cantidad: quantity,
              precioUnitario: producto.precio
            });
            this.calcularTotales();
            console.log(`Producto ${producto.nombre} agregado al carrito desde query params`);
          }
        }

        // Manejar filtro por categoría
        if (categoriaId && this.productosDisponibles.length > 0) {
          this.selectedCategoria = categoriaId;
          this.filterProducts();
          console.log(`Filtrado por categoría desde query params: ${categoriaId}`);
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
      this.addedProductQuantity = itemExistente.cantidad;
    } else {
      // Si no existe, añade el producto al carrito
      this.carrito.push({
        productoId: producto._id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio
      });
      console.log(`Producto ${producto.nombre} añadido al carrito.`);
      this.addedProductQuantity = 1;
    }
    
    // Configurar el modal de confirmación
    this.addedProduct = producto;
    this.showCartModal = true;
    
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
          // Redirigir a "Mis Pedidos" después de confirmar el pedido
          this.router.navigate(['/mis-pedidos']);
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

  // Métodos para el buscador
  onSearchInput(): void {
    // Debounce para evitar demasiadas búsquedas
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filterProducts();
    }, 300);
  }

  onCategoryChange(): void {
    console.log('Categoría seleccionada:', this.selectedCategoria);
    this.filterProducts();
  }

  filterProducts(): void {
    // Si se está usando cualquier filtro, resetear la bandera de producto específico
    if (this.searchTerm.trim() || this.selectedCategoria.trim()) {
      this.isShowingSpecificProduct = false;
    }

    let productosFiltrados = [...this.productosDisponibles];

    // Filtrar por categoría si está seleccionada
    if (this.selectedCategoria && this.selectedCategoria.trim() !== '') {
      console.log('Filtrando por categoría:', this.selectedCategoria);
      console.log('Total productos antes del filtro:', productosFiltrados.length);
      
      productosFiltrados = productosFiltrados.filter(producto => {
        // Verificar si el producto tiene categoriaId
        if (!producto.categoriaId) {
          console.log('Producto sin categoriaId:', producto.nombre);
          return false;
        }
        
        // Manejar tanto string como objeto para categoriaId
        if (typeof producto.categoriaId === 'string') {
          const matches = producto.categoriaId === this.selectedCategoria;
          console.log('Comparación string:', producto.categoriaId, '===', this.selectedCategoria, '=', matches);
          return matches;
        } else if (producto.categoriaId && typeof producto.categoriaId === 'object') {
          const categoriaObj = producto.categoriaId as { _id: string; nombre: string };
          const matches = categoriaObj._id === this.selectedCategoria;
          console.log('Comparación objeto:', categoriaObj._id, '===', this.selectedCategoria, '=', matches);
          return matches;
        }
        
        console.log('categoriaId no válido para:', producto.nombre, 'tipo:', typeof producto.categoriaId);
        return false;
      });
      
      console.log('Productos filtrados por categoría:', productosFiltrados.length);
    }

    // Filtrar por término de búsqueda si existe
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      productosFiltrados = productosFiltrados.filter(producto => 
        producto.nombre.toLowerCase().includes(searchLower) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(searchLower))
      );
      console.log('Filtrado por búsqueda:', this.searchTerm);
      console.log('Productos filtrados por búsqueda:', productosFiltrados.length);
    }

    this.productosFiltrados = productosFiltrados;
    console.log('Total productos filtrados:', this.productosFiltrados.length);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.isShowingSpecificProduct = false;
    this.filterProducts();
  }

  clearCategoryFilter(): void {
    this.selectedCategoria = '';
    this.isShowingSpecificProduct = false;
    this.filterProducts();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategoria = '';
    this.isShowingSpecificProduct = false;
    this.productosFiltrados = [...this.productosDisponibles];
  }

  /**
   * Cierra el modal de confirmación de producto agregado.
   */
  closeCartModal(): void {
    this.showCartModal = false;
    this.addedProduct = null;
    this.addedProductQuantity = 0;
  }

  /**
   * Navega a la sección del carrito (mantiene al usuario en la misma página).
   */
  goToCart(): void {
    this.closeCartModal();
    // Hacer scroll suave hacia la sección del carrito
    const cartSection = document.querySelector('.cart-panel');
    if (cartSection) {
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Muestra todos los productos disponibles (resetea el filtro de producto específico).
   */
  showAllProducts(): void {
    this.isShowingSpecificProduct = false;
    this.productosFiltrados = [...this.productosDisponibles];
    console.log('Mostrando todos los productos disponibles');
  }
}
