// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth'; // Asegúrate de que la ruta sea './services/auth.service'
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs'; // Importar Subscription

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de que sea standalone si no está en un NgModule
  imports: [RouterOutlet, CommonModule], // HeaderComponent ha sido eliminado de aquí
  templateUrl: './app.html', // O './app.component.html' si es el nombre de tu archivo
  styleUrl: './app.css' // O './app.component.css' si es el nombre de tu archivo
})
export class App implements OnInit, OnDestroy {
  title = 'SUBTE App';
  currentUser: any; // Propiedad para almacenar la información del usuario logueado
  private currentUserSubscription: Subscription; // Para manejar la suscripción

  constructor(private router: Router, private authService: AuthService) {
    // Suscribirse al observable currentUser del AuthService en el constructor
    // Esto asegura que el componente reciba el valor inicial inmediatamente
    this.currentUserSubscription = this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });
  }
  
  ngOnInit(): void {
    // La lógica de verificación inicial ya se maneja en los guards y en el constructor.
    // Puedes añadir lógica adicional aquí si es necesario.
  }

  ngOnDestroy(): void {
    // Desuscribirse para evitar fugas de memoria cuando el componente se destruya
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  // Método para cerrar sesión (puede ser movido a un componente de navegación si lo prefieres)
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirige al usuario a la página de inicio de sesión
  } 
}
