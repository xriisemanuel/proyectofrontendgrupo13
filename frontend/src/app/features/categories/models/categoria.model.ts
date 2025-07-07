// src/app/features/categories/models/categoria.model.ts
export interface ICategoria {
    _id: string; // MongoDB ObjectId
    nombre: string;
    descripcion?: string; // Opcional
    imagen?: string;      // Opcional
    estado: boolean;
    createdAt?: string;   // Si usas timestamps en Mongoose
    updatedAt?: string;   // Si usas timestamps en Mongoose
}