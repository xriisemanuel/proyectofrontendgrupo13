import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'SUBTE App'; // Título de tu aplicación
  currentUser: any; // Propiedad para almacenar la información del usuario logueado

  constructor(private router: Router, private authService: AuthService) {}
  
  ngOnInit(): void {
    this.authService.currentUser.subscribe(x => this.currentUser = x);
    // Verifica si hay un usuario logueado al iniciar la aplicación
  }
  // Método para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirige al usuario a la página de inicio de sesión
  } 
}
