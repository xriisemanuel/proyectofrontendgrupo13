import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { ComboService, Combo } from '../../services/combo.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router'; // Asegúrate de RouterLink esté aquí
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../services/auth'; // Asegúrate de que la ruta sea correcta: '../../services/auth'
import { ComboCardComponent } from '../combo-card/combo-card.component';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs'; // Importar Subject y operadores

@Component({
  selector: 'app-combo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, ComboCardComponent], // Asegúrate de RouterLink en imports
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit, OnDestroy {
  combos: Combo[] = [];
  combosVisibles: Combo[] = [];
  terminoBusqueda: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  productosDisponibles: Producto[] = [];

  errorCarga: string = '';
  cargando: boolean = false;

  @ViewChild('comboSearchInput') comboSearchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private comboService: ComboService, 
    private productoService: ProductoService, 
    public authService: AuthService, // AuthService es público para usarlo en el template
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.aplicarFiltrosYBusqueda();
    });
  }

  ngOnInit() {
    // --- INICIO DE DEPURACIÓN DE ROL EN COMBO LIST (MUY IMPORTANTE) ---
    const userRole = this.authService.getRole();
    const isAdmin = this.authService.hasAdminPermissions();
    console.log('COMBO LIST DEBUG (ngOnInit): Rol detectado por AuthService:', userRole);
    console.log('COMBO LIST DEBUG (ngOnInit): ¿Tiene permisos de Admin?', isAdmin);
    // --- FIN DE DEPURACIÓN DE ROL EN COMBO LIST ---

    this.cargarCombos();
    this.cargarProductos();
    
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId) && sessionStorage.getItem('focusComboSearch') === '1') {
        this.irABuscarCombo();
        sessionStorage.removeItem('focusComboSearch');
      }
    }, 400);
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  cargarCombos() {
    this.cargando = true;
    this.errorCarga = '';
    
    this.comboService.getCombos().subscribe({
      next: (data) => {
        this.combos = data;
        this.aplicarFiltrosYBusqueda();
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        if (error.status === 401) {
          this.errorCarga = 'Debes iniciar sesión para ver los combos.';
        } else if (error.status === 403) {
          this.errorCarga = 'No tienes permisos para ver los combos.';
        } else {
          this.errorCarga = 'Error al cargar los combos.';
        }
        this.combos = [];
        this.combosVisibles = [];
      }
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data: Producto[]) => { 
        this.productosDisponibles = data; 
      },
      error: (error) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar productos:', error);
        }
      }
    });
  }

  aplicarFiltrosYBusqueda(): void {
    let tempCombos = [...this.combos];

    const userRole = this.authService.getRole();
    // --- INICIO DE DEPURACIÓN DE ROL EN aplicarFiltrosYBusqueda ---
    console.log('COMBO LIST DEBUG (aplicarFiltrosYBusqueda): Rol detectado por AuthService:', userRole);
    // --- FIN DE DEPURACIÓN DE ROL EN aplicarFiltrosYBusqueda ---
    
    if (userRole === 'cliente') {
      tempCombos = tempCombos.filter(combo => combo.estado === true);
    } else if (userRole === 'admin' || userRole === 'supervisor_ventas') {
      // Los administradores y supervisores de ventas ven todos los combos
    } else {
      tempCombos = []; 
    }

    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (termino) {
      tempCombos = tempCombos.filter(combo => 
        combo.nombre.toLowerCase().includes(termino) ||
        (combo.descripcion && combo.descripcion.toLowerCase().includes(termino))
      );
    }

    this.combosVisibles = tempCombos;
  }

  eliminarCombo(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este combo?')) {
      this.comboService.deleteCombo(id).subscribe({
        next: () => {
          this.cargarCombos();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el combo');
        }
      });
    }
  }

  activarCombo(id: string) {
    this.comboService.activarCombo(id).subscribe({
      next: () => { 
        this.cargarCombos(); 
      },
      error: (error) => {
        console.error('Error al activar:', error);
        alert('Error al activar el combo');
      }
    });
  }

  desactivarCombo(id: string) {
    this.comboService.desactivarCombo(id).subscribe({
      next: () => { 
        this.cargarCombos(); 
      },
      error: (error) => {
        console.error('Error al desactivar:', error);
        alert('Error al desactivar el combo');
      }
    });
  }

  editarCombo(id: string) {
    this.router.navigate(['/editar-combo', id]);
  }

  onSearchInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.terminoBusqueda = value; 
    this.searchSubject.next(value); 
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltrosYBusqueda();
  }

  onErrorImagen(event: any) {
    event.target.src = 'https://placehold.co/400x200/cccccc/333333?text=No+Imagen'; 
  }

  onLoadImagen(event: any) {
    event.target.style.display = 'block';
  }

  esUrlValida(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  irABuscarCombo() {
    if (this.comboSearchInput && this.comboSearchInput.nativeElement) {
      this.comboSearchInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.comboSearchInput.nativeElement.focus(), 400);
    }
  }
}
