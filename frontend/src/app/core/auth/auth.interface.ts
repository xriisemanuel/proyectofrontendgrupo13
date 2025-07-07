// proyecto/frontend/src/app/core/auth/auth.interface.ts
export interface IRegisterUserPayload {
    username: string;
    passwordHash: string; // Coincide con cómo lo espera el backend ahora
    email: string;
    telefono: string | null; // Puede ser string o null
    rolName: string; // Nombre del rol
    nombre: string;
    apellido: string;

    // Campos específicos de Cliente (opcionales)
    direccionCliente?: string | null;
    fechaNacimientoCliente?: string | null; // Se envía como string 'YYYY-MM-DD'
    preferenciasAlimentariasCliente?: string[] | null; // Se envía como array de strings
    puntosCliente?: number | null;

    // Campos específicos de Repartidor (opcionales)
    vehiculoRepartidor?: string | null;
    numeroLicenciaRepartidor?: string | null;
}

// Interfaz para la respuesta exitosa del registro (opcional, pero buena práctica)
export interface IRegisterSuccessResponse {
    mensaje: string;
    usuarioId: string;
    perfilId?: string; // Opcional, si se creó un perfil específico
    rol: string;
}