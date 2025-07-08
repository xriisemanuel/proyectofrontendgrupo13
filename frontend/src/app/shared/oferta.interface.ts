// src/app/shared/interfaces/oferta.interface.ts

import { IProducto, ICategoria } from '../shared/interfaces'; // Ajusta la ruta si es necesario
export interface IOferta {
  _id?: string;
  nombre: string;
  descripcion?: string;
  descuento: number; // Porcentaje de descuento (ej. 10 para 10%)
  fechaInicio: Date | string; // Puede venir como string de la API
  fechaFin: Date | string; // Puede venir como string de la API
  productosAplicables: string[] | IProducto[]; // Puede ser solo IDs al crear/editar, o productos populados al obtener
  categoriasAplicables: string[] | ICategoria[]; // Puede ser solo IDs al crear/editar, o categorías populadas al obtener
  estado: boolean; // Corresponde a 'activa' en el backend
  createdAt?: Date;
  updatedAt?: Date;
}

// Opcional: Interfaz si quieres representar los productos/categorías populados directamente
export interface IOfertaPopulated extends IOferta {
  productosAplicables: IProducto[];
  categoriasAplicables: ICategoria[];
}