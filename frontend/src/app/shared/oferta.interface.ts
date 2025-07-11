// src/app/shared/interfaces/oferta.interface.ts

import { IProducto, ICategoria } from './interfaces';

export interface IOferta {
  _id?: string;
  nombre: string;
  descripcion?: string;
  porcentajeDescuento: number;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  tipoOferta: 'producto' | 'categoria';
  productosAplicables: string[] | IProducto[];
  categoriasAplicables: string[] | ICategoria[];
  activa: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOfertaPopulated extends IOferta {
  productosAplicables: IProducto[];
  categoriasAplicables: ICategoria[];
}