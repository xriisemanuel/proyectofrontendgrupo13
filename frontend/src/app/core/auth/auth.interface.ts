// proyecto/frontend/src/app/core/auth/auth.interface.ts
export interface IRegisterUserPayload {
    username: string;
    password: string; // <--- ¡Cambia esto de 'passwordHash' a 'password'!
    email: string;
    telefono: string | null;
    rolName: string;
    nombre: string;
    apellido: string;
    direccionCliente?: string | null;
    fechaNacimientoCliente?: string | null;
    preferenciasAlimentariasCliente?: string[] | null;
    puntosCliente?: number | null;
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