import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ClienteService, ICliente, IUsuario } from '../../services/cliente'; // Importa ICliente y IUsuario
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css']
})
export class ClientDashboard implements OnInit, OnDestroy {
  cliente: ICliente | null = null;
  usuario: IUsuario | null = null; // Información del usuario asociada al cliente
  isLoading: boolean = true;
  errorMessage: string = '';

  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadClientData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadClientData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cliente = null;
    this.usuario = null;

    const loggedInUserId = this.authService.getLoggedInUserId(); // Obtiene el ID del usuario logueado
    const userRole = this.authService.getRole();

    console.log('ClientDashboard DEBUG: Usuario logueado ID:', loggedInUserId);
    console.log('ClientDashboard DEBUG: Rol del usuario logueado:', userRole);

    if (!loggedInUserId || userRole !== 'cliente') {
      this.errorMessage = 'No se pudo cargar el perfil del cliente. Asegúrate de estar logueado como cliente.';
      this.isLoading = false;
      console.error('ClientDashboard: Usuario no logueado o no es un cliente.');
      return;
    }

    // Usar el nuevo método para obtener el perfil de cliente por el ID del usuario
    this.subscriptions.push(
      this.clienteService.getClienteByUsuarioId(loggedInUserId).subscribe({
        next: (data) => {
          this.cliente = data;
          this.usuario = data.usuarioId; // usuarioId ya está poblado como IUsuario en la respuesta del backend
          this.isLoading = false;
          console.log('ClientDashboard: Datos del cliente cargados:', this.cliente);
        },
        error: (err) => {
          console.error('ClientDashboard: Error al cargar datos del cliente:', err);
          this.errorMessage = err.error?.mensaje || 'Error al cargar tu perfil de cliente. Asegúrate de que tu perfil de cliente exista.';
          this.isLoading = false;
        }
      })
    );
  }

  // Métodos de navegación a otras partes del dashboard
  goToCalificaciones(): void {
    // Aquí puedes usar el Router directamente si no tienes un método navigateTo en AuthService
    // O si lo tienes, asegúrate de que esté inyectado y funcione.
    // import { Router } from '@angular/router';
    // private router = inject(Router);
    // this.router.navigate(['/calificaciones']);
    window.location.href = '/calificaciones'; // Alternativa simple si Router no está funcionando bien
  }

  goToMisPedidos(): void {
    window.location.href = '/mis-pedidos'; // Ruta que necesitarás definir
  }

  goToEditProfile(): void {
    // Esto podría llevar a un formulario de edición de perfil de usuario o cliente
    // Si tienes un formulario genérico para editar usuarios:
    // window.location.href = `/admin/users/update/${this.usuario?._id}`; // Si el admin puede editar usuarios
    // O una ruta específica para que el cliente edite su propio perfil:
    window.location.href = `/perfil`; // Una ruta genérica para editar el perfil del usuario logueado
  }
}
