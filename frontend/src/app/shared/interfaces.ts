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
    usuarioId: string;
    direccion: string;
    fechaNacimiento?: string;
    preferenciasAlimentarias?: string[];
    puntos: number;
}

export interface IRepartidorPerfil {
    _id: string;
    usuarioId: string;
    estado: string;
    vehiculo: string;
    numeroLicencia: string;
    ubicacionActual?: { lat: number, lon: number };
    historialEntregas?: any[];
    calificacionPromedio?: number;
    disponible?: boolean;
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
    repartidorId?: IRepartidorPerfil; // Usa la interfaz IRepartidorPerfil centralizada
    createdAt?: Date;
    updatedAt?: Date;
}

// --- NUEVAS INTERFACES PARA PRODUCTOS Y CATEGORÍAS ---

export interface ICategoria {
  _id: string;
  nombre: string;
  descripcion?: string;
  estado: boolean; // true para activo, false para inactivo
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProducto {
  _id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: ICategoria | string; // Puede ser el objeto completo o solo el ID
  stock: number;
  imagenUrl?: string; // URL de la imagen del producto
  estado: boolean; // true para activo, false para inactivo
  createdAt?: Date;
  updatedAt?: Date;
}