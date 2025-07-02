import { Component, OnInit, OnDestroy } from '@angular/core'; // Importa OnDestroy
import { Router, RouterLink } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor'; // Asegúrate de que la ruta sea correcta
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { Subject } from 'rxjs'; // Importa Subject
import { takeUntil } from 'rxjs/operators'; // Importa takeUntil

@Component({
  selector: 'app-manage-repartidores',
  templateUrl: './manage-repartidores.html', // Asegúrate de que el nombre del archivo sea .component.html
  styleUrls: ['./manage-repartidores.css'], // Asegúrate de que el nombre del archivo sea .component.css
  standalone: true, // Indica que es un componente standalone
  imports: [RouterLink, CommonModule] // Importa RouterLink y CommonModule
})
export class ManageRepartidores implements OnInit, OnDestroy { // Cambiado a ManageRepartidoresComponent para consistencia
  repartidores: any[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = true; // Para mostrar un spinner mientras se cargan los datos

  private destroy$ = new Subject<void>(); // Subject para desuscribirse de observables

  constructor(
    private repartidorService: RepartidorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRepartidores();
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Emite un valor para que todos los observables se desuscriban
    this.destroy$.complete(); // Completa el Subject
  }

  /**
   * Carga la lista de repartidores desde el backend.
   * Los datos del usuario asociado (nombre, apellido, email, telefono)
   * se obtendrán a través de la población del campo 'usuarioId' en el backend.
   */
  loadRepartidores(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true; // Inicia el estado de carga

    this.repartidorService.getRepartidores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.repartidores = data;
        this.isLoading = false; // Finaliza el estado de carga
        console.log('Repartidores cargados desde el backend (con usuario poblado):', this.repartidores);
      },
      error: (err) => {
        console.error('Error al cargar los repartidores:', err);
        this.errorMessage = err.error?.mensaje || 'Error al cargar los repartidores desde el servidor.';
        this.isLoading = false; // Finaliza el estado de carga incluso con error
      }
    });
  }

  /**
   * Navega a la pantalla de edición de un repartidor.
   * @param repartidorId El ID del repartidor a editar (el _id del perfil de repartidor).
   */
  editRepartidor(repartidorId: string): void {
    console.log('Navegando para editar repartidor con ID:', repartidorId);
    this.router.navigate(['/admin/repartidores/update', repartidorId]); // Asumiendo una ruta de actualización
  }

  /**
   * Elimina un repartidor después de la confirmación del usuario.
   * @param repartidorId El ID del repartidor a eliminar (el _id del perfil de repartidor).
   */
  deleteRepartidor(repartidorId: string): void {
    // Reemplazar `confirm` con un modal personalizado en un entorno de producción
    if (confirm('¿Estás seguro de que quieres eliminar este repartidor? Esta acción no se puede deshacer.')) {
      this.repartidorService.deleteRepartidor(repartidorId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.successMessage = response.mensaje || 'Repartidor eliminado exitosamente!';
          console.log('Repartidor eliminado:', response);
          this.loadRepartidores(); // Recarga la lista después de eliminar
        },
        error: (err) => {
          console.error('Error al eliminar el repartidor:', err);
          this.errorMessage = err.error?.mensaje || 'Error al eliminar el repartidor. Asegúrese de que no tenga pedidos asociados.';
        }
      });
    }
  }
}
