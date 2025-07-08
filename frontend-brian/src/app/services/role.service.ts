/**
 * Servicio de Gestión de Roles
 * 
 * Maneja la gestión de roles de usuario en el sistema:
 * - Definición de tipos de roles disponibles
 * - Gestión del rol actual del usuario
 * - Verificación de permisos por rol
 * - Persistencia del rol en sessionStorage
 * - Roles estáticos predefinidos
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';

/** Tipos de roles disponibles en el sistema */
export type UserRole = 'admin' | 'cliente' | 'supervisor_cocina' | 'supervisor_ventas' | 'repartidor';

/** Interfaz para la estructura de un rol */
export interface Role {
  _id: string;
  nombre: string;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  /** URL base de la API de roles */
  private apiUrl = 'http://localhost:3000/api/rol';
  
  /** Subject para el rol actual del usuario */
  private currentRoleSubject = new BehaviorSubject<UserRole>('cliente');
  
  /** Observable público del rol actual */
  public currentRole$ = this.currentRoleSubject.asObservable();

  /** Roles estáticos disponibles en el sistema */
  private staticRoles: Role[] = [
    { _id: '1', nombre: 'admin', estado: true },
    { _id: '2', nombre: 'cliente', estado: true },
    { _id: '3', nombre: 'supervisor_cocina', estado: true },
    { _id: '4', nombre: 'supervisor_ventas', estado: true },
    { _id: '5', nombre: 'repartidor', estado: true }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    // Intentar recuperar el rol del sessionStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedRole = sessionStorage.getItem('userRole');
      if (savedRole && this.isValidRole(savedRole)) {
        this.currentRoleSubject.next(savedRole as UserRole);
      }
    }
  }

  /**
   * Obtiene todos los roles disponibles (estáticos)
   * @returns Observable con la lista de roles
   */
  getRoles(): Observable<Role[]> {
    return of(this.staticRoles);
  }

  /**
   * Obtiene un rol específico por ID (estático)
   * @param id - ID del rol a buscar
   * @returns Observable con el rol encontrado o cliente por defecto
   */
  getRoleById(id: string): Observable<Role> {
    const role = this.staticRoles.find(r => r._id === id);
    return of(role || this.staticRoles[1]); // Retorna cliente por defecto si no encuentra
  }

  /**
   * Establece el rol actual del usuario
   * @param role - Rol a establecer
   */
  setRole(role: UserRole): void {
    this.currentRoleSubject.next(role);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('userRole', role);
    }
  }

  /**
   * Obtiene el rol actual del usuario
   * @returns Rol actual
   */
  getRole(): UserRole {
    return this.currentRoleSubject.value;
  }

  /**
   * Verifica si el usuario es administrador
   * @returns true si el rol es 'admin'
   */
  isAdmin(): boolean {
    return this.currentRoleSubject.value === 'admin';
  }

  /**
   * Verifica si el usuario es cliente
   * @returns true si el rol es 'cliente'
   */
  isCliente(): boolean {
    return this.currentRoleSubject.value === 'cliente';
  }

  /**
   * Verifica si el usuario es supervisor de cocina
   * @returns true si el rol es 'supervisor_cocina'
   */
  isSupervisorCocina(): boolean {
    return this.currentRoleSubject.value === 'supervisor_cocina';
  }

  /**
   * Verifica si el usuario es supervisor de ventas
   * @returns true si el rol es 'supervisor_ventas'
   */
  isSupervisorVentas(): boolean {
    return this.currentRoleSubject.value === 'supervisor_ventas';
  }

  /**
   * Verifica si el usuario es repartidor
   * @returns true si el rol es 'repartidor'
   */
  isRepartidor(): boolean {
    return this.currentRoleSubject.value === 'repartidor';
  }

  /**
   * Verifica si el usuario tiene permisos de administrador o supervisor
   * @returns true si tiene permisos de admin o supervisor
   */
  hasAdminPermissions(): boolean {
    const role = this.currentRoleSubject.value;
    return role === 'admin' || role === 'supervisor_cocina' || role === 'supervisor_ventas';
  }

  /**
   * Limpia el rol actual del usuario
   * Restablece a 'cliente' y elimina del sessionStorage
   */
  clearRole(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('userRole');
    }
    this.currentRoleSubject.next('cliente');
  }

  /**
   * Valida si un string es un rol válido
   * @param role - String a validar
   * @returns true si es un rol válido
   */
  private isValidRole(role: string): role is UserRole {
    return ['admin', 'cliente', 'supervisor_cocina', 'supervisor_ventas', 'repartidor'].includes(role);
  }
}