// src/app/shared/interfaces/pedido.interface.ts

// Interfaz para el detalle de un producto dentro del pedido (lo que el cliente selecciona)
export interface IDetalleProductoFrontend {
    productoId: string; // ID del producto
    nombreProducto: string; // Nombre del producto (para mostrar en el carrito)
    cantidad: number; // Cantidad seleccionada
    precioUnitario: number; // Precio unitario al momento de añadir (para mostrar en el carrito)
    subtotal?: number; // Subtotal calculado en frontend (opcional, backend recalcula)
}

// Interfaz para el payload que se envía al backend al crear un pedido
// Nota: clienteId no se incluye aquí, ya que el backend lo obtiene del usuario autenticado.
export interface IPedidoPayload {
    detalleProductos: {
        productoId: string;
        cantidad: number;
    }[]; // Solo necesitamos ID y cantidad para el backend
    direccionEntrega: string;
    metodoPago: 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Efectivo' | 'Transferencia' | 'Mercado Pago' | 'Otro';
    descuentos?: number; // Opcional, si el cliente puede aplicar algún código
    costoEnvio?: number; // Opcional, si el cliente ve el costo de envío
    observaciones?: string;
}

// Interfaz para la respuesta del backend al crear un pedido (puede ser más completa)
export interface IPedidoResponse {
    mensaje: string;
    pedido: {
        _id: string;
        clienteId: string;
        fechaPedido: string;
        estado: string;
        direccionEntrega: string;
        metodoPago: string;
        subtotal: number;
        descuentos: number;
        costoEnvio: number;
        total: number;
        detalleProductos: {
            productoId: string;
            nombreProducto: string;
            cantidad: number;
            precioUnitario: number;
            subtotal: number;
            _id: string; // Mongoose añade _id a los subdocumentos por defecto si no se especifica _id: false
        }[];
        fechaEstimadaEntrega?: string;
        repartidorId?: string;
        observaciones?: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
    };
}

// Interfaz básica para un Producto (asumiendo que lo obtendrás de tu API de productos)
export interface IProducto {
    _id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoriaId: string; // Opcional, si la necesitas
    imageUrl?: string; // URL de la imagen del producto
    // ... cualquier otra propiedad que tenga tu modelo Producto
}
