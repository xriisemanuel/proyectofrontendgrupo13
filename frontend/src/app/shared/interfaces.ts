// src/app/shared/interfaces.ts

export interface IRol {
    _id: string;
    nombre: string;
    estado: boolean;
    fechaCreacion?: Date; // createdAt
    updatedAt?: Date; // updatedAt
}

export interface IClientePerfil {
    _id: string;
    usuarioId: string | IUsuario; // <--- ¡Asegúrate de que esto sea 'string | IUsuario'!
    direccion: string;
    fechaNacimiento?: string;
    preferenciasAlimentarias?: string[];
    puntos: number;
}

export interface IUsuario {
    _id: string;
    username: string;
    email: string;
    telefono?: string;
    nombre: string;
    apellido: string;
    rolId: IRol; // Ahora usa la interfaz IRol centralizada
    estado: boolean;
    clienteId?: IClientePerfil; // Usa la interfaz IClientePerfil centralizada
    repartidorId?: IRepartidor; // Usa la interfaz IRepartidor centralizada (asumo que IRepartidorPerfil se renombra a IRepartidor)
    createdAt?: Date;
    updatedAt?: Date;
}

// --- INTERFACES PARA PRODUCTOS Y CATEGORÍAS ---

export interface ICategoria {
    _id?: string;
    nombre: string;
    descripcion?: string;
    imagen?: string;
    estado?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProducto {
  _id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: string; // O ICategoria['_id']
  imagen?: string;
  disponible: boolean;
  stock: number;
  popularidad?: number; // Para ordenar por popularidad
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUbicacionActual {
    lat: number | null;
    lon: number | null;
}

export interface IHistorialEntrega {
    pedidoId?: string;
    fechaEntrega?: Date;
    calificacionCliente?: number;
}

// Interfaz para el subdocumento detalleProductos
export interface IDetalleProducto {
    productoId: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal?: number; // El backend lo calcula, pero puede venir en la respuesta
}

// Interfaz para el repartidor populado (si usuarioId está poblado)
// Esta es la interfaz clave para tu dashboard de repartidor
export interface IRepartidor {
    _id: string;
    usuarioId: IUsuario; // DEBE ser IUsuario (objeto poblado) para que el dashboard funcione
    estado: string;
    vehiculo?: string;
    numeroLicencia?: string;
    ubicacionActual?: IUbicacionActual;
    historialEntregas?: IHistorialEntrega[];
    calificacionPromedio?: number;
    disponible?: boolean;
}

// Interfaz principal para un Pedido
export interface IPedido {
    _id?: string; // Opcional al crear
    clienteId: IClientePerfil; // <--- ¡AHORA ESTO PUEDE CONTENER usuarioId: IUsuario!
    fechaPedido?: Date;
    estado: 'pendiente' | 'confirmado' | 'en_preparacion' | 'en_envio' | 'entregado' | 'cancelado';
    direccionEntrega: string;
    metodoPago: string;
    subtotal?: number; // Calculado en el backend
    descuentos?: number;
    costoEnvio?: number;
    total?: number; // Calculado en el backend
    detalleProductos: IDetalleProducto[];
    fechaEstimadaEntrega?: Date | null;
    repartidorId?: string | IRepartidor | null; // Puede ser solo el ID, el objeto populado o null
    observaciones?: string | null;
    createdAt?: Date; // Si usas timestamps: true
    updatedAt?: Date; // Si usas timestamps: true
}
// Nueva interfaz para Combo
export interface ICombo {
  _id?: string;
  nombre: string;
  descripcion?: string;
  productosIds: string[]; // Array de IDs de productos (se usará para enviar al backend)
  productosDetalles?: IProducto[]; // Para cuando los productosIds vienen populados del backend
  precioCombo: number;
  descuento?: number; // Porcentaje
  imagen?: string;
  activo?: boolean; // Coincide con 'estado' en el modelo de backend, aunque aquí usaremos 'activo'
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICliente {
  _id: string;
  usuarioId: IUsuario; // usuarioId DEBE ser del tipo IUsuario (el objeto poblado)
  direccion: string;
  fechaNacimiento?: Date;
  preferenciasAlimentarias?: string[];
  puntos?: number;
}
// -
// src/app/shared/interfaces/calificacion.interface.ts

// Interfaz para la calificación de productos específicos dentro de un pedido
export interface ICalificacionProducto {
  _id?: string; // Mongoose podría añadir un _id a los subdocumentos si no se especifica _id: false
  productoId: string;
  nombreProducto: string;
  puntuacion: number; // 1-5 estrellas
  comentario?: string | null; // Opcional, puede ser null
}

// Interfaz para la calificación general de un pedido
export interface ICalificacion {
  _id?: string; // ID generado por MongoDB
  pedidoId: string;
  clienteId: string;
  puntuacionComida: number; // 1-5 estrellas
  puntuacionServicio: number; // 1-5 estrellas
  puntuacionEntrega: number; // 1-5 estrellas
  comentario?: string | null; // Opcional, puede ser null, max 500 caracteres
  fechaCalificacion?: Date | string; // Fecha de calificación, por defecto Date.now
  calificacionProductos?: ICalificacionProducto[]; // Array de calificaciones de productos
}
