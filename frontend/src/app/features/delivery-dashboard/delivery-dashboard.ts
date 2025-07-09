// src/app/features/delivery-dashboard/delivery-dashboard.ts

import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router'; // <-- ¡Importa Router!

// Rutas de importación de servicios (asegurando que apunten a los archivos .service.ts)
import { AuthService } from '../../core/auth/auth';
import { IRepartidor, IHistorialEntrega, IPedido, IClientePerfil, IUsuario } from '../../shared/interfaces';
import { PedidoService } from '../../data/services/pedido';
import { RepartidorService } from '../../data/services/repartidor';

import { catchError, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

// Declaración de tipos para Google Maps
declare global {
  interface Window {
    google: any;
    initMapCallback: () => void;
  }
}

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TitleCasePipe
  ],
  templateUrl: './delivery-dashboard.html',
  styleUrls: ['./delivery-dashboard.css']
})
export class DeliveryDashboard implements OnInit, OnDestroy {

  repartidor: IRepartidor | null = null;
  pedidosAsignados: IPedido[] = [];
  loadingRepartidor = true;
  loadingPedidos = true;
  loadingMap = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private repartidorSubscription: Subscription | undefined;
  private pedidosSubscription: Subscription | undefined;

  map: any;
  marker: any;
  geolocationWatchId: number | undefined;
  locationUpdateInterval: any;
  isTrackingLocation: boolean = false;
  isMapLoaded: boolean = false;
  private isBrowser: boolean;

  private Maps_API_KEY = 'AIzaSyB3mJIYkOHsOiDcEpdIyR8dQlPzqRDCvmE';
  private LOCATION_UPDATE_INTERVAL_MS = 10000;

  constructor(
    private authService: AuthService,
    private repartidorService: RepartidorService,
    private pedidoService: PedidoService,
    private toastr: ToastrService,
    private router: Router, // <-- ¡Inyecta Router aquí!
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadRepartidorData();
    if (this.isBrowser) {
      this.loadGoogleMapsScript();
    } else {
      this.loadingMap = false;
    }
  }

  ngOnDestroy(): void {
    this.repartidorSubscription?.unsubscribe();
    this.pedidosSubscription?.unsubscribe();
    this.stopLocationTracking();
  }

  /**
   * Método para cerrar la sesión del usuario.
   */
  logout(): void {
    this.authService.logout(); // Asume que este método limpia el token y el estado de la sesión
    this.toastr.info('Has cerrado sesión.', '¡Hasta pronto!');
    this.router.navigate(['/auth/login']); // Redirige al usuario a la página de login
  }


  /**
   * Carga el script de Google Maps API dinámicamente.
   * Asegura que el script solo se añada una vez y que el mapa se inicialice
   * solo después de que la API esté completamente cargada.
   */
  loadGoogleMapsScript(): void {
    // Si el script ya existe en el DOM, no lo cargues de nuevo.
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // Si el script ya está en el DOM, espera a que el callback global se active
      // o comprueba si google.maps ya está disponible.
      if (this.isMapLoaded && typeof window.google !== 'undefined' && window.google.maps) {
        // Usar coordenadas por defecto si no hay ubicación
        const lat = this.repartidor?.ubicacionActual?.lat ?? -31.3283;
        const lon = this.repartidor?.ubicacionActual?.lon ?? -64.2008;
        this.initMap(lat, lon);
      }
      return;
    }

    this.loadingMap = true;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.Maps_API_KEY}&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Definir la función de callback globalmente.
    // Esta función será llamada por la API de Google Maps una vez que se cargue completamente.
    window.initMapCallback = () => {
      console.log('Google Maps API cargada y callback ejecutado.');
      this.isMapLoaded = true;
      this.loadingMap = false;
      this.toastr.success('Mapa de Google Maps cargado.', '¡Listo!');

      // Inicializar el mapa con la ubicación actual o una por defecto
      const lat = this.repartidor?.ubicacionActual?.lat ?? -31.3283;
      const lon = this.repartidor?.ubicacionActual?.lon ?? -64.2008;
      this.initMap(lat, lon);

      // Opcional: Iniciar el seguimiento automáticamente si el repartidor ya está cargado y disponible
      if (this.repartidor && this.repartidor.estado === 'disponible') {
        this.startLocationTracking();
      }
    };

    script.onerror = () => {
      this.loadingMap = false;
      this.errorMessage = 'Error al cargar el script de Google Maps. Verifique su API Key o la conexión a internet.';
      this.toastr.error('No se pudo cargar el mapa.', 'Error');
      console.error('Error al cargar el script de Google Maps. URL:', script.src);
    };
  }

  /**
   * Inicializa el mapa de Google Maps y el marcador.
   * @param lat Latitud inicial.
   * @param lon Longitud inicial.
   */
  initMap(lat: number, lon: number): void {
    // Comprobaciones en tiempo de ejecución para asegurar que 'google' y 'google.maps' están definidos
    if (!this.isBrowser || !this.isMapLoaded || typeof window.google === 'undefined' || !window.google.maps) {
      console.warn('No se pudo inicializar el mapa: Navegador o API de Google Maps no lista.');
      return;
    }

    const mapOptions = {
      center: new window.google.maps.LatLng(lat, lon),
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP
    };

    const mapElement = document.getElementById('map') as HTMLElement;
    if (mapElement) {
      this.map = new window.google.maps.Map(mapElement, mapOptions);

      this.marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(lat, lon),
        map: this.map,
        title: 'Mi Ubicación',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });
      this.toastr.info('Mapa inicializado.', 'Mapa');
    } else {
      console.error('Elemento #map no encontrado para inicializar el mapa.');
      this.toastr.error('No se encontró el contenedor del mapa.', 'Error');
    }
  }

  /**
   * Inicia el seguimiento de la ubicación del repartidor y la envía al backend.
   */
  startLocationTracking(): void {
    if (!this.isBrowser || !this.isMapLoaded || this.isTrackingLocation) {
      return;
    }

    if (!this.repartidor?._id) {
      this.toastr.error('No se puede iniciar el seguimiento: Repartidor no cargado.', 'Error');
      return;
    }

    // Verificar si Geolocation API está disponible
    if (!navigator.geolocation) {
      this.toastr.error('La API de Geolocalización no está disponible en este navegador.', 'Error');
      this.errorMessage = 'La geolocalización no es compatible con este dispositivo.';
      return;
    }

    this.isTrackingLocation = true;
    this.toastr.info('Iniciando seguimiento de ubicación...', 'Seguimiento');
    this.errorMessage = null;

    // Obtener la ubicación inicial y luego iniciar el watch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.updateMapAndBackendLocation(position);
        this.toastr.success('Ubicación inicial obtenida.', 'Seguimiento');
      },
      (error) => {
        this.handleGeolocationError(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Iniciar el seguimiento continuo de la ubicación
    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updateMapAndBackendLocation(position);
      },
      (error) => {
        this.handleGeolocationError(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Configurar el intervalo para enviar la ubicación al backend (si no se actualiza con watchPosition)
    this.locationUpdateInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.sendLocationToBackend(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Error en getCurrentPosition para el intervalo:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }, this.LOCATION_UPDATE_INTERVAL_MS);
  }

  /**
   * Detiene el seguimiento de la ubicación.
   */
  stopLocationTracking(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.geolocationWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = undefined;
    }
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = undefined;
    }
    this.isTrackingLocation = false;
    this.toastr.info('Seguimiento de ubicación detenido.', 'Seguimiento');
  }

  /**
   * Actualiza el marcador en el mapa y envía la ubicación al backend.
   * @param position Objeto GeolocationPosition.
   */
  private updateMapAndBackendLocation(position: GeolocationPosition): void {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Asegurarse de que 'google' y 'google.maps' estén disponibles antes de usarlos
    if (this.map && this.marker && typeof window.google !== 'undefined' && window.google.maps) {
      const newLatLng = new window.google.maps.LatLng(lat, lon);
      this.marker.setPosition(newLatLng);
      this.map.setCenter(newLatLng);
    }
    this.sendLocationToBackend(lat, lon);
  }

  /**
   * Envía la ubicación (lat, lon) al backend.
   * @param lat Latitud.
   * @param lon Longitud.
   */
  private sendLocationToBackend(lat: number, lon: number): void {
    if (!this.repartidor?._id) {
      console.warn('No hay ID de repartidor para enviar ubicación al backend.');
      return;
    }
    this.repartidorService.updateUbicacion(this.repartidor._id, lat, lon)
      .pipe(
        tap(() => {
          if (this.repartidor?.ubicacionActual) {
            this.repartidor.ubicacionActual.lat = lat;
            this.repartidor.ubicacionActual.lon = lon;
          } else if (this.repartidor) {
            this.repartidor.ubicacionActual = { lat: lat, lon: lon };
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al enviar la ubicación al backend:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Maneja los errores de la API de Geolocation.
   * @param error Objeto GeolocationPositionError.
   */
  private handleGeolocationError(error: GeolocationPositionError): void {
    this.isTrackingLocation = false;
    this.stopLocationTracking();
    let msg = 'Error de geolocalización: ';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg += 'Permiso denegado por el usuario.';
        break;
      case error.POSITION_UNAVAILABLE:
        msg += 'Información de ubicación no disponible.';
        break;
      case error.TIMEOUT:
        msg += 'Tiempo de espera agotado.';
        break;
      default:
        msg += 'Error desconocido.';
        break;
    }
    this.errorMessage = msg;
    this.toastr.error(msg, 'Error de Geolocalización');
    console.error('Error de geolocalización:', error);
  }

  /**
   * Carga los datos del perfil del repartidor autenticado.
   * Utiliza el ID de usuario del AuthService para obtener el perfil de repartidor.
   */
  loadRepartidorData(): void {
    this.loadingRepartidor = true;
    this.errorMessage = null;
    const userId = this.authService.getLoggedInUserId();

    if (userId) {
      this.repartidorSubscription = this.repartidorService.getRepartidorByUserId(userId)
        .pipe(
          tap((repartidorData: IRepartidor | null) => {
            console.log('Datos del repartidor recibidos y asignados:', repartidorData);
            this.repartidor = repartidorData;
            this.loadingRepartidor = false;
            if (this.repartidor) {
              this.loadPedidosAsignados();
              // Inicializar el mapa con la ubicación del repartidor si está disponible
              if (this.isMapLoaded) {
                const lat = this.repartidor.ubicacionActual?.lat ?? -31.3283;
                const lon = this.repartidor.ubicacionActual?.lon ?? -64.2008;
                this.initMap(lat, lon);
              }
            } else {
              this.errorMessage = 'No se encontró un perfil de repartidor asociado a este usuario.';
              this.loadingPedidos = false;
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error al cargar los datos del repartidor:', error);
            this.errorMessage = `Error al cargar perfil: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
            this.loadingRepartidor = false;
            this.loadingPedidos = false;
            return of(null);
          })
        )
        .subscribe();
    } else {
      this.errorMessage = 'ID de usuario no encontrado. Por favor, inicie sesión.';
      this.loadingRepartidor = false;
      this.loadingPedidos = false;
    }
  }

  /**
   * Carga los pedidos asignados al repartidor actualmente logueado.
   * Filtra por estados relevantes para el repartidor (confirmado, en_preparacion, en_envio).
   */
  loadPedidosAsignados(): void {
    if (!this.repartidor?._id) {
      console.warn('No hay ID de repartidor para cargar pedidos asignados.');
      this.loadingPedidos = false;
      return;
    }

    this.loadingPedidos = true;
    this.errorMessage = null;
    this.pedidosSubscription = this.pedidoService.getPedidosByRepartidorId(this.repartidor._id, ['confirmado', 'en_preparacion', 'en_envio'])
      .pipe(
        tap((pedidos: IPedido[]) => {
          this.pedidosAsignados = pedidos;
          this.loadingPedidos = false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cargar los pedidos asignados:', error);
          this.errorMessage = `Error al cargar pedidos: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.loadingPedidos = false;
          return of([]);
        })
      )
      .subscribe();
  }

  /**
   * Cambia el estado operacional del repartidor.
   * @param newStatus El nuevo estado ('disponible', 'en_entrega', 'fuera_de_servicio').
   */
  changeRepartidorStatus(newStatus: string): void {
    if (!this.repartidor?._id) {
      this.errorMessage = 'No se puede cambiar el estado: Repartidor no cargado.';
      return;
    }
    this.repartidorService.cambiarEstadoRepartidor(this.repartidor._id, newStatus)
      .pipe(
        tap(() => {
          if (this.repartidor) {
            this.repartidor.estado = newStatus;
          }
          this.toastr.success(`Estado actualizado a: ${newStatus}`, '¡Estado Actualizado!');
          // Si el repartidor se pone disponible, iniciar seguimiento automáticamente
          if (newStatus === 'disponible') {
            this.startLocationTracking();
          } else {
            this.stopLocationTracking(); // Detener seguimiento si no está disponible
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cambiar el estado del repartidor:', error);
          this.errorMessage = `Error al actualizar estado: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.toastr.error(this.errorMessage, 'Error');
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Marca un pedido como 'en_envio' y lo asocia al repartidor.
   * @param pedidoId El ID del pedido a tomar.
   */
  takeOrder(pedidoId: string): void {
    if (!this.repartidor?._id) {
      this.errorMessage = 'No se puede tomar el pedido: Repartidor no cargado.';
      return;
    }
    this.pedidoService.updatePedido(pedidoId, {
      estado: 'en_envio',
      repartidorId: this.repartidor._id
    })
      .pipe(
        tap(() => {
          this.toastr.success(`Pedido ${pedidoId} tomado y en camino.`, '¡Pedido Tomado!');
          this.loadPedidosAsignados();
          this.changeRepartidorStatus('en_entrega'); // Cambiar estado a 'en_entrega'
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al tomar el pedido:', error);
          this.errorMessage = `Error al tomar pedido: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.toastr.error(this.errorMessage, 'Error');
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Registra la entrega de un pedido y actualiza el historial del repartidor.
   * @param pedido El objeto Pedido a entregar.
   * @param calificacion Opcional. Calificación del cliente para la entrega.
   */
  deliverOrder(pedido: IPedido, calificacion: number | null = null): void {
    if (!this.repartidor?._id || !pedido._id) {
      this.errorMessage = 'No se puede registrar la entrega: Datos incompletos.';
      return;
    }

    // Primero actualiza el estado del pedido a 'entregado'
    this.pedidoService.updatePedido(pedido._id, { estado: 'entregado' })
      .pipe(
        tap(() => {
          const entregaData: { pedidoId: string; calificacionCliente?: number; fechaEntrega: Date } = {
            pedidoId: pedido._id!,
            fechaEntrega: new Date()
          };
          if (calificacion !== null && calificacion !== undefined) {
            entregaData.calificacionCliente = calificacion;
          }

          // Luego registra la entrega en el historial del repartidor
          this.repartidorService.registrarEntregaRepartidor(this.repartidor!._id, entregaData)
            .pipe(
              tap(() => {
                this.toastr.success(`Pedido ${pedido._id} entregado con éxito.`, '¡Entrega Registrada!');
                this.loadRepartidorData(); // Recargar datos del repartidor para actualizar historial y calificación
                this.loadPedidosAsignados(); // Recargar pedidos asignados
                // Si no hay más pedidos en envío, el repartidor podría volver a "disponible"
                if (this.pedidosAsignados.filter(p => p.estado === 'en_envio').length === 0) {
                  this.changeRepartidorStatus('disponible');
                }
              }),
              catchError((error: HttpErrorResponse) => {
                console.error('Error al registrar la entrega en el historial:', error);
                this.errorMessage = `Error al registrar entrega: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
                this.toastr.error(this.errorMessage, 'Error');
                return of(null);
              })
            )
            .subscribe();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al actualizar el estado del pedido a entregado:', error);
          this.errorMessage = `Error al entregar pedido: ${error.error?.mensaje || error.message || 'Error desconocido'}`;
          this.toastr.error(this.errorMessage, 'Error');
          return of(null);
        })
      )
      .subscribe();
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  getHistorialEntregaDisplay(entrega: IHistorialEntrega): string {
    const fecha = entrega.fechaEntrega ? new Date(entrega.fechaEntrega).toLocaleDateString() : 'N/A';
    const calificacion = entrega.calificacionCliente ? `${entrega.calificacionCliente}/5 estrellas` : 'Sin calificar';
    return `Pedido ${entrega.pedidoId} - Fecha: ${fecha} - Calificación: ${calificacion}`;
  }

  /**
   * Obtiene el nombre completo del cliente a partir de su perfil.
   * Maneja el caso en que usuarioId sea solo un string o un objeto IUsuario.
   * @param clientePerfil El perfil del cliente.
   * @returns El nombre completo del cliente o 'Cliente Desconocido'.
   */
  getClienteFullName(clientePerfil: IClientePerfil): string {
    if (clientePerfil && clientePerfil.usuarioId) {
      if (typeof clientePerfil.usuarioId === 'object' && 'nombre' in clientePerfil.usuarioId && 'apellido' in clientePerfil.usuarioId) {
        return `${clientePerfil.usuarioId.nombre} ${clientePerfil.usuarioId.apellido}`;
      } else if (typeof clientePerfil.usuarioId === 'string') {
        return `Cliente (ID: ${clientePerfil.usuarioId})`;
      }
    }
    return 'Cliente Desconocido';
  }
}