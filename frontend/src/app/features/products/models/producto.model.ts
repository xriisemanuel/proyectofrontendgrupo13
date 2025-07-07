// src/app/features/products/models/producto.model.ts

import { ICategoria } from "../../categories/models/categoria.model";

// Interfaz para la Categoria (solo con los campos que se popularán en el producto)
// export interface CategoriaSimple {
//   _id: string;
//   nombre: string;
//   descripcion?: string; // Opcional, según cómo lo uses
// }

export interface Producto {
  _id?: string; // Es opcional porque no estará presente al crear un nuevo producto
  nombre: string;
  descripcion?: string; // El backend tiene default null, aquí lo hacemos opcional
  precio: number;
  categoriaId: string | ICategoria; // Puede ser solo el ID (al enviar) o el objeto populado (al recibir)
  imagenes: string[]; // Array de URLs de imágenes
  disponible?: boolean; // El backend tiene default true y lo gestiona por stock
  stock: number;
  popularidad?: number; // El backend tiene default 0

  // Timestamps de Mongoose, si los usas (createdAt, updatedAt)
  createdAt?: Date;
  updatedAt?: Date;
}