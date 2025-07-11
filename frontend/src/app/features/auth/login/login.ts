import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth'; // Asegúrate de que la ruta sea correcta
import { Router, RouterLink, ActivatedRoute } from '@angular/router'; // Para la redirección
import { CommonModule } from '@angular/common'; // Necesario para directivas como ngIf, ngFor
import { FormsModule } from '@angular/forms'; // Necesario para ngModel

// Declaraciones de tipos para Google API
declare var gapi: any;
declare var google: any;

@Component({
  selector: 'app-login', // Selector para usar este componente en el HTML
  standalone: true, // Marca el componente como standalone si no está en un NgModule
  imports: [FormsModule, CommonModule, RouterLink], // Importaciones de módulos Angular necesarios
  templateUrl: './login.html', // Archivo HTML asociado
  styleUrls: ['./login.css'] // Archivo CSS asociado
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  username = ''; // Propiedad para el input de usuario
  password = ''; // Propiedad para el input de contraseña
  errorMessage = ''; // Mensaje de error a mostrar en la UI
  isLoading = false; // Para mostrar estado de carga
  googleButtonLoaded = false; // Para controlar si el botón de Google se cargó
  private initTimeout: any; // Para manejar el timeout de inicialización

  // Inyecta el AuthService y el Router en el constructor
  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit: Verificando autenticación...');
    if (this.authService.isAuthenticated()) {
      console.log('LoginComponent ngOnInit: Usuario ya autenticado. Redirigiendo...');
      this.redirectToDashboardByRole();
    } else {
      console.log('LoginComponent ngOnInit: Usuario no autenticado. Mostrar formulario de login.');
    }
  }

  ngAfterViewInit(): void {
    // Inicializar Google Identity Services después de que el DOM esté listo
    this.initializeGoogleIdentityServices();
  }

  ngOnDestroy(): void {
    // Limpiar timeout si el componente se destruye
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
    // Limpiar estado de carga
    this.isLoading = false;
  }

  // Método que se ejecuta al enviar el formulario de login
  onSubmit(): void {
    this.errorMessage = ''; // Limpia cualquier mensaje de error anterior
    console.log('onSubmit: Intentando iniciar sesión con usuario:', this.username);

    // Llama al método login del AuthService con el username y password
    this.authService.login(this.username, this.password).subscribe({
      next: data => {
        console.log('Login exitoso:', data); // Muestra los datos de respuesta en consola
        this.redirectToDashboardByRole(); // Redirige al usuario a un dashboard específico según su rol
      },
      error: err => {
        // Manejo de errores en caso de que el login falle
        console.error('Error de login:', err);
        // Extrae el mensaje de error de la respuesta del backend, o usa un mensaje genérico
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Credenciales incorrectas o problema de conexión.';
        console.log('Mensaje de error mostrado:', this.errorMessage);
      }
    });
  }

  // Método para inicializar Google Identity Services (público para el botón de respaldo)
  initializeGoogleIdentityServices(): void {
    try {
      console.log('Inicializando Google Identity Services...');
      
      // Verificar si Google Identity Services ya está cargado
      if (typeof google === 'undefined') {
        console.log('Cargando Google Identity Services...');
        this.loadGoogleIdentityServices().then(() => {
          this.setupGoogleIdentityServices();
        }).catch((error: any) => {
          console.error('Error al cargar Google Identity Services:', error);
          this.errorMessage = 'Error al cargar Google Identity Services. Verifica tu conexión a internet.';
        });
      } else {
        console.log('Google Identity Services ya cargado, configurando...');
        this.setupGoogleIdentityServices();
      }
      
    } catch (error) {
      console.error('Error en initializeGoogleIdentityServices:', error);
      this.errorMessage = 'Error al inicializar Google Identity Services. Verifica tu conexión a internet.';
    }
  }

  // Método para configurar Google Identity Services
  private setupGoogleIdentityServices(): void {
    try {
      // Agregar timeout para evitar que se quede cargando indefinidamente
      this.initTimeout = setTimeout(() => {
        console.error('Timeout al inicializar Google Identity Services');
        this.errorMessage = 'Timeout al inicializar Google Identity Services. Inténtalo de nuevo.';
      }, 10000); // 10 segundos de timeout

      // Inicializar Google Identity Services
      google.accounts.id.initialize({
        client_id: '427682572521-5cvcnk79ge40i8hfcfrtulv2n5ljm5qt.apps.googleusercontent.com',
        callback: (response: any) => {
          clearTimeout(this.initTimeout);
          console.log('Google Identity Services callback:', response);
          
          if (response.credential) {
            this.isLoading = true;
            // Enviar el token al backend
            this.authService.googleLogin(response.credential).subscribe({
              next: data => {
                console.log('Login con Google exitoso:', data);
                this.isLoading = false;
                this.redirectToDashboardByRole();
              },
              error: err => {
                console.error('Error en login con Google:', err);
                this.isLoading = false;
                this.errorMessage = err.error?.mensaje || 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
              }
            });
          } else {
            console.error('No se recibió credencial de Google');
            this.errorMessage = 'No se pudo obtener la credencial de Google. Inténtalo de nuevo.';
          }
        }
      });

      // Renderizar el botón de Google Sign-In
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'), // Elemento donde mostrar el botón
        { 
          theme: 'outline', 
          size: 'large',
          width: '100%',
          text: 'continue_with'
        }
      );

      // Marcar que el botón se cargó correctamente
      this.googleButtonLoaded = true;
      console.log('Google Identity Services configurado correctamente');
      
    } catch (error) {
      clearTimeout(this.initTimeout);
      console.error('Error en setupGoogleIdentityServices:', error);
      this.errorMessage = 'Error al configurar Google Identity Services. Verifica tu conexión a internet.';
    }
  }

  // Método para cargar Google Identity Services
  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar si ya está cargada
      if (typeof google !== 'undefined') {
        resolve();
        return;
      }

      // Crear el script de Google Identity Services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services cargado exitosamente');
        resolve();
      };
      script.onerror = () => {
        console.error('Error al cargar Google Identity Services');
        reject(new Error('Error al cargar Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Redirige al usuario a su dashboard específico basado en su rol.
   * Este método se usa tanto en ngOnInit (si ya está logueado) como en onSubmit (después de un login exitoso).
   */
  private redirectToDashboardByRole(): void {
    const userRole = this.authService.getRole(); // Obtiene el rol del usuario desde el servicio de autenticación
    console.log('redirectToDashboardByRole: Rol obtenido:', userRole);

    // Verificar si hay una URL de retorno específica
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      console.log('Redirigiendo a URL de retorno:', returnUrl);
      this.router.navigate([returnUrl]);
      return;
    }

    if (userRole === 'admin') {
      console.log('Redirigiendo a: /admin/dashboard');
      this.router.navigate(['/admin/dashboard']); // Redirige al dashboard de administrador
    } else if (userRole === 'cliente') {
      console.log('Redirigiendo a: /cliente/dashboard');
      this.router.navigate(['/cliente/dashboard']); // Redirige al dashboard de cliente
    } else if (userRole === 'supervisor_cocina') {
      console.log('Redirigiendo a: /kitchen/dashboard');
      this.router.navigate(['/kitchen/dashboard']); // Redirige al dashboard de supervisor de cocina
    } else if (userRole === 'supervisor_ventas') {
      console.log('Redirigiendo a: /sales/dashboard');
      this.router.navigate(['/sales/dashboard']); // Redirige al dashboard de supervisor de ventas
    } else if (userRole === 'repartidor') {
      console.log('Redirigiendo a: /delivery/dashboard');
      this.router.navigate(['/delivery/dashboard']); // Redirige al dashboard de repartidor
    } else {
      // Si el rol no es reconocido o es nulo, redirige a una página por defecto o a login
      console.warn('Rol de usuario no reconocido o nulo. Redirigiendo a /dashboard.');
      this.router.navigate(['/dashboard']); // Redirige a un dashboard genérico o a una página de inicio
    }
  }
}
