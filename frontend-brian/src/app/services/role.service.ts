import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';

export type UserRole = 'admin' | 'cliente' | 'supervisor_cocina' | 'supervisor_ventas' | 'repartidor';

export interface Role {
  _id: string;
  nombre: string;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:3000/api/rol';
  private currentRoleSubject = new BehaviorSubject<UserRole>('cliente');
  public currentRole$ = this.currentRoleSubject.asObservable();

  // Roles estáticos disponibles en el sistema
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

  // Obtener todos los roles disponibles (estáticos)
  getRoles(): Observable<Role[]> {
    return of(this.staticRoles);
  }

  // Obtener un rol específico por ID (estático)
  getRoleById(id: string): Observable<Role> {
    const role = this.staticRoles.find(r => r._id === id);
    return of(role || this.staticRoles[1]); // Retorna cliente por defecto si no encuentra
  }

  setRole(role: UserRole): void {
    this.currentRoleSubject.next(role);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('userRole', role);
    }
  }

  getRole(): UserRole {
    return this.currentRoleSubject.value;
  }

  isAdmin(): boolean {
    return this.currentRoleSubject.value === 'admin';
  }

  isCliente(): boolean {
    return this.currentRoleSubject.value === 'cliente';
  }

  isSupervisorCocina(): boolean {
    return this.currentRoleSubject.value === 'supervisor_cocina';
  }

  isSupervisorVentas(): boolean {
    return this.currentRoleSubject.value === 'supervisor_ventas';
  }

  isRepartidor(): boolean {
    return this.currentRoleSubject.value === 'repartidor';
  }

  // Verificar si el usuario tiene permisos de administrador o supervisor
  hasAdminPermissions(): boolean {
    const role = this.currentRoleSubject.value;
    return role === 'admin' || role === 'supervisor_cocina' || role === 'supervisor_ventas';
  }

  clearRole(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('userRole');
    }
    this.currentRoleSubject.next('cliente');
  }

  private isValidRole(role: string): role is UserRole {
    return ['admin', 'cliente', 'supervisor_cocina', 'supervisor_ventas', 'repartidor'].includes(role);
  }
}