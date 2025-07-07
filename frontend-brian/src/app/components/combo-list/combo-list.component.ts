import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { ComboService, Combo } from '../../services/combo.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ComboCardComponent } from '../combo-card/combo-card.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-combo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ComboCardComponent],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit {
  combos: Combo[] = [];
  productos: Producto[] = [];
  terminoBusqueda: string = '';
  combosFiltrados: Combo[] = [];
  errorCarga: string = '';
  cargando: boolean = false;
  @ViewChild('comboSearchInput') comboSearchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private comboService: ComboService, 
    private productoService: ProductoService, 
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Cargar combos (ahora es público)
    this.cargarCombos();
    // Solo cargar productos si es administrador (para mostrar en las cards)
    if (this.authService.hasAdminPermissions()) {
      this.cargarProductos();
    }
    // Enfocar búsqueda si viene de Home
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId) && sessionStorage.getItem('focusComboSearch') === '1') {
        this.irABuscarCombo();
        sessionStorage.removeItem('focusComboSearch');
      }
    }, 400);
  }

  cargarCombos() {
    this.cargando = true;
    this.errorCarga = '';
    
    this.comboService.getCombos().subscribe({
      next: (data) => {
        this.combos = data;
        this.filtrarCombosPorRol();
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
        this.combosFiltrados = [];
      }
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: (error) => {
        if (error.status !== 401 && error.status !== 403) {
          console.error('Error al cargar productos:', error);
        }
        this.productos = [];
      }
    });
  }

  filtrarCombosPorRol() {
    if (this.authService.isCliente()) {
      // Los clientes solo ven combos activos
      this.combosFiltrados = this.combos.filter(combo => combo.estado === true);
    } else {
      // Los administradores ven todos los combos
      this.combosFiltrados = [...this.combos];
    }
  }

  eliminarCombo(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este combo?')) {
      this.comboService.deleteCombo(id).subscribe({
        next: () => {
          this.combos = this.combos.filter(combo => combo._id !== id);
          this.filtrarCombosPorRol();
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
      next: (response: any) => {
        const comboActualizado = response.combo;
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error) => {
        console.error('Error al activar:', error);
        alert('Error al activar el combo');
      }
    });
  }

  desactivarCombo(id: string) {
    this.comboService.desactivarCombo(id).subscribe({
      next: (response: any) => {
        const comboActualizado = response.combo;
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error) => {
        console.error('Error al desactivar:', error);
        alert('Error al desactivar el combo');
      }
    });
  }

  actualizarComboEnListas(id: string, comboActualizado: any) {
    const indexPrincipal = this.combos.findIndex(combo => combo._id === id);
    if (indexPrincipal !== -1) {
      this.combos[indexPrincipal] = comboActualizado;
    }
    
    this.filtrarCombosPorRol();
  }

  editarCombo(id: string) {
    // Redirigir a la página de edición de combo
    this.router.navigate(['/editar-combo', id]);
  }

  obtenerNombresProductos(productosIds: string[]): string {
    if (!productosIds || productosIds.length === 0) {
      return 'Sin productos';
    }
    
    const nombres = productosIds.map(id => {
      const producto = this.productos.find(p => p._id === id);
      return producto ? producto.nombre : 'Producto no encontrado';
    });
    
    return nombres.join(', ');
  }

  filtrarCombos() {
    if (!this.terminoBusqueda.trim()) {
      this.filtrarCombosPorRol();
      return;
    }
    
    const termino = this.terminoBusqueda.toLowerCase();
    this.combosFiltrados = this.combos.filter(combo => 
      combo.nombre.toLowerCase().includes(termino) ||
      combo.descripcion.toLowerCase().includes(termino)
    );
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.filtrarCombosPorRol();
  }

  onErrorImagen(event: any) {
    event.target.src = 'assets/images/placeholder.jpg';
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
