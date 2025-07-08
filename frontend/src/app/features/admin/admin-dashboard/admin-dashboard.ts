// src/app/features/admin/components/admin-dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth'; // Importa tu servicio de autenticación (ruta corregida)
import { Router, RouterLink } from '@angular/router'; // ¡Importa Router!
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink], // Añadido CommonModule para directivas como ngIf/ngFor
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  standalone: true,
})
export class AdminDashboard implements OnInit {
  // Datos de ejemplo para las tarjetas de resumen (se reemplazarán con datos reales de la API)
  summaryData = {
    pedidosPendientes: 15,
    pedidosCompletadosHoy: 45,
    nuevosUsuariosSemana: 8,
    productosAgotados: 3,
    repartidoresActivos: 5,
    ingresosHoy: '1,250.00'
  };
  currentUser: any; // Para almacenar la información del administrador logueado

  constructor(
    private authService: AuthService,
    private router: Router // ¡Inyecta Router!
  ) { }

  ngOnInit(): void {
    // Al inicializar, obtenemos la información del usuario actual desde el AuthService
    this.currentUser = this.authService.currentUserValue;
    console.log('Admin Dashboard cargado. Usuario actual:', this.currentUser);

    // Aquí es donde en el futuro harías llamadas a tu backend
    // para obtener los datos reales para las tarjetas de resumen y otras tablas.
    // Ejemplo: this.http.get(`${API_BASE_URL}/admin/summary`).subscribe(data => { ... });
  }

  /**
   * Maneja la acción de cerrar sesión.
   * Llama al método logout del AuthService y redirige al usuario a la página de login.
   */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']); // Redirige al login después de cerrar sesión
  }
}