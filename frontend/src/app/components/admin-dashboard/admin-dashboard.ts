import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth'; // Importa tu servicio de autenticación
import { RouterLink } from '@angular/router'; // Para usar routerLink en el template
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  standalone: true, 
})
export class AdminDashboard implements OnInit{ // Para almacenar la información del administrador logueado

  // Datos de ejemplo para las tarjetas de resumen (se reemplazarán con datos reales de la API)
  summaryData = {
    pedidosPendientes: 15,
    pedidosCompletadosHoy: 45,
    nuevosUsuariosSemana: 8,
    productosAgotados: 3,
    repartidoresActivos: 5,
    ingresosHoy: '1,250.00'
  };
  currentUser: any;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Al inicializar, obtenemos la información del usuario actual desde el AuthService
    this.currentUser = this.authService.currentUserValue;
    console.log('Admin Dashboard cargado. Usuario actual:', this.currentUser);

    // Aquí es donde en el futuro harías llamadas a tu backend
    // para obtener los datos reales para las tarjetas de resumen y otras tablas.
    // Ejemplo: this.http.get(`${API_BASE_URL}/admin/summary`).subscribe(data => { ... });
  }
}
  
