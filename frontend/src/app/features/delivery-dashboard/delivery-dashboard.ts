// src/app/features/delivery-dashboard/delivery-dashboard.ts

import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

import { RepartidorService } from '../../data/services/repartidor';
import { PedidoService } from '../../data/services/pedido';
import { AuthService } from '../../core/auth/auth';
import { IRepartidor, IPedido, IClientePerfil } from '../../shared/interfaces';

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
  imports: [CommonModule],
  templateUrl: './delivery-dashboard.html',
  styleUrls: ['./delivery-dashboard.css']
})
export class DeliveryDashboard implements OnInit, OnDestroy {
  // === VARIABLES DE ESTADO ===
  repartidor: IRepartidor | null = null;
  loadingRepartidor = true;
  loadingPedidos = false;
  pedidosAsignados: IPedido[] = [];
  errorMessage = '';
  successMessage = '';

  // === VARIABLES DEL MAPA ===
  map: any;
  marker: any;
  geolocationWatchId: number | undefined;
  locationUpdateInterval: any;
  isTrackingLocation: boolean = false;
  isMapLoaded: boolean = false;
  private isBrowser: boolean;
  private Maps_API_KEY = 'AIzaSyB3mJIYkOHsOiDcEpdIyR8dQlPzqRDCvmE';
  private LOCATION_UPDATE_INTERVAL_MS = 10000;

  // === SUBSCRIPTIONS ===
  private destroy$ = new Subject<void>();

  constructor(
    private repartidorService: RepartidorService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadRepartidorData();
    this.loadPedidosAsignados();
    if (this.isBrowser) {
      this.loadGoogleMapsScript();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopLocationTracking();
  }

  // === CARGA DE DATOS ===

  /**
   * Carga los datos del repartidor autenticado
   */
  loadRepartidorData(): void {
    this.loadingRepartidor = true;
    
    const userId = this.authService.getLoggedInUserId();
    if (!userId) {
      this.toastr.error('No se pudo obtener el ID del usuario', 'Error');
      this.loadingRepartidor = false;
      return;
    }
    
    this.repartidorService.getRepartidorByUserId(userId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error cargando datos del repartidor:', error);
          this.toastr.error('Error al cargar datos del repartidor', 'Error');
          return of(null);
        })
      )
      .subscribe(repartidor => {
        this.repartidor = repartidor;
        this.loadingRepartidor = false;
        
        if (repartidor) {
          console.log('Datos del repartidor cargados:', repartidor);
        }
      });
  }

  /**
   * Carga los pedidos asignados al repartidor
   */
  loadPedidosAsignados(): void {
    this.loadingPedidos = true;
    
    this.pedidoService.getPedidos(['en_envio', 'confirmado'])
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error cargando pedidos:', error);
          this.toastr.error('Error al cargar pedidos', 'Error');
          return of([]);
        })
      )
      .subscribe(pedidos => {
        // Filtrar pedidos que pueden ser tomados por este repartidor
        this.pedidosAsignados = pedidos.filter(pedido => 
          !pedido.repartidorId || 
          (typeof pedido.repartidorId === 'object' && pedido.repartidorId._id === this.repartidor?._id)
        );
        this.loadingPedidos = false;
        console.log('Pedidos cargados:', this.pedidosAsignados.length);
      });
  }

  // === GESTIÓN DE PEDIDOS ===

  /**
   * Toma un pedido disponible
   */
  takeOrder(pedidoId: string): void {
    if (!this.repartidor?._id) {
      this.toastr.error('No se pudo identificar al repartidor', 'Error');
      return;
    }

    this.pedidoService.updatePedido(pedidoId, { 
      estado: 'en_envio',
      repartidorId: this.repartidor._id 
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error tomando pedido:', error);
          this.toastr.error('Error al tomar el pedido', 'Error');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.toastr.success('Pedido tomado exitosamente', '¡Pedido Asignado!');
          this.loadPedidosAsignados(); // Recargar lista
        }
      });
  }

  /**
   * Marca un pedido como entregado
   */
  deliverOrder(pedido: IPedido): void {
    if (!pedido._id) {
      this.toastr.error('ID de pedido no válido', 'Error');
      return;
    }

    this.pedidoService.updateEstadoPedido(pedido._id, 'entregado')
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error entregando pedido:', error);
          this.toastr.error('Error al marcar como entregado', 'Error');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.toastr.success('Pedido marcado como entregado', '¡Entregado!');
          this.loadPedidosAsignados(); // Recargar lista
        }
      });
  }

  // === GESTIÓN DE ESTADO ===

  /**
   * Cambia el estado del repartidor
   */
  changeRepartidorStatus(newStatus: string): void {
    if (!this.repartidor?._id) {
      this.toastr.error('No se pudo identificar al repartidor', 'Error');
      return;
    }

    this.repartidorService.cambiarEstadoRepartidor(this.repartidor._id, newStatus)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          console.error('Error cambiando estado:', error);
          this.toastr.error('Error al cambiar estado', 'Error');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response && this.repartidor) {
          this.repartidor.estado = newStatus;
          this.toastr.success(`Estado cambiado a: ${newStatus}`, 'Estado Actualizado');
        }
      });
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * Obtiene el nombre completo del cliente
   */
  getClienteFullName(clientePerfil: IClientePerfil): string {
    if (clientePerfil && clientePerfil.usuarioId) {
      if (typeof clientePerfil.usuarioId === 'object' && 'nombre' in clientePerfil.usuarioId) {
        return `${clientePerfil.usuarioId.nombre} ${clientePerfil.usuarioId.apellido}`;
      } else if (typeof clientePerfil.usuarioId === 'string') {
        return `Cliente (ID: ${clientePerfil.usuarioId})`;
      }
    }
    return 'Cliente Desconocido';
  }

  /**
   * Obtiene el número de calificaciones que tiene el repartidor
   */
  getCalificacionesCount(): number {
    if (!this.repartidor?.historialEntregas) {
      return 0;
    }
    return this.repartidor.historialEntregas.filter(entrega => 
      entrega.calificacionCliente !== undefined && entrega.calificacionCliente !== null
    ).length;
  }

  /**
   * Obtiene el texto para mostrar en el historial de entregas
   */
  getHistorialEntregaDisplay(entrega: any): string {
    if (entrega.pedidoId) {
      const pedidoId = typeof entrega.pedidoId === 'string' 
        ? entrega.pedidoId.slice(-8) 
        : entrega.pedidoId._id?.slice(-8) || 'N/A';
      return `Pedido #${pedidoId}`;
    }
    return 'Entrega sin pedido';
  }

  /**
   * Recalcula la calificación promedio del repartidor
   */
  recalcularCalificacionRepartidor(): void {
    if (!this.repartidor?._id) {
      console.warn('No hay ID de repartidor para recalcular calificación.');
      return;
    }

    // Por ahora, simplemente recargamos los datos del repartidor
    // ya que el método recalcularCalificacion no existe en el servicio
    this.loadRepartidorData();
  }

  /**
   * Navega a la página de edición de perfil
   */
  editProfile(): void {
    this.router.navigate(['/delivery/profile/edit']);
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // === MÉTODOS DEL MAPA ===

  /**
   * Carga el script de Google Maps API dinámicamente.
   */
  loadGoogleMapsScript(): void {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if (this.isMapLoaded && typeof window.google !== 'undefined' && window.google.maps) {
        const lat = this.repartidor?.ubicacionActual?.lat ?? -31.3283;
        const lon = this.repartidor?.ubicacionActual?.lon ?? -64.2008;
        this.initMap(lat, lon);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.Maps_API_KEY}&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.initMapCallback = () => {
      console.log('Google Maps API cargada y callback ejecutado.');
      this.isMapLoaded = true;
      this.toastr.success('Mapa de Google Maps cargado.', '¡Listo!');

      const lat = this.repartidor?.ubicacionActual?.lat ?? -31.3283;
      const lon = this.repartidor?.ubicacionActual?.lon ?? -64.2008;
      this.initMap(lat, lon);

      if (this.repartidor && this.repartidor.estado === 'disponible') {
        this.startLocationTracking();
      }
    };

    script.onerror = () => {
      this.errorMessage = 'Error al cargar el script de Google Maps. Verifique su API Key o la conexión a internet.';
      this.toastr.error('No se pudo cargar el mapa.', 'Error');
      console.error('Error al cargar el script de Google Maps. URL:', script.src);
    };
  }

  /**
   * Inicializa el mapa de Google Maps y el marcador.
   */
  initMap(lat: number, lon: number): void {
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
   * Inicia el seguimiento de la ubicación del repartidor.
   */
  startLocationTracking(): void {
    if (!this.isBrowser || !this.isMapLoaded || this.isTrackingLocation) {
      return;
    }

    if (!this.repartidor?._id) {
      this.toastr.error('No se puede iniciar el seguimiento: Repartidor no cargado.', 'Error');
      return;
    }

    if (!navigator.geolocation) {
      this.toastr.error('La API de Geolocalización no está disponible en este navegador.', 'Error');
      this.errorMessage = 'La geolocalización no es compatible con este dispositivo.';
      return;
    }

    this.isTrackingLocation = true;
    this.toastr.info('Iniciando seguimiento de ubicación...', 'Seguimiento');
    this.errorMessage = '';

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

    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updateMapAndBackendLocation(position);
      },
      (error) => {
        this.handleGeolocationError(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

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
   */
  private updateMapAndBackendLocation(position: GeolocationPosition): void {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    if (this.map && this.marker && typeof window.google !== 'undefined' && window.google.maps) {
      const newLatLng = new window.google.maps.LatLng(lat, lon);
      this.marker.setPosition(newLatLng);
      this.map.setCenter(newLatLng);
    }
    this.sendLocationToBackend(lat, lon);
  }

  /**
   * Envía la ubicación al backend.
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
}