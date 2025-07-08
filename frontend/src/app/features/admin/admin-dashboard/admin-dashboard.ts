// src/app/features/admin/components/admin-dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth';
import { Router, RouterLink } from '@angular/router'; // RouterLink
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink], // <--- ¡AÑADIDO RouterLink!
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  standalone: true,
})
export class AdminDashboard implements OnInit {
  summaryData = {
    pedidosPendientes: 15,
    pedidosCompletadosHoy: 45,
    nuevosUsuariosSemana: 8,
    productosAgotados: 3,
    repartidoresActivos: 5,
    ingresosHoy: '1,250.00'
  };
  currentUser: any;

  constructor(
    private authService: AuthService,
    private router: Router // Inyección de Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    console.log('Admin Dashboard cargado. Usuario actual:', this.currentUser);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}