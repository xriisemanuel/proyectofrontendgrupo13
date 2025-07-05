import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-oferta-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './oferta-list.component.html',
  styleUrl: './oferta-list.component.css'
})
export class OfertaListComponent implements OnInit {
  ofertas: Oferta[] = [];
  ofertasFiltradas: Oferta[] = [];
  terminoBusqueda: string = '';
  private searchSubject = new Subject<string>();
  ofertaEditando: Oferta | null = null;
  mostrarModal = false;
  
  // Productos y categorías disponibles
  productosDisponibles: Producto[] = [];
  categoriasDisponibles: Categoria[] = [];
  
  // Arrays temporales para la selección múltiple
  productosSeleccionados: string[] = [];
  categoriasSeleccionadas: string[] = [];

  constructor(
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termino => {
        if (termino.trim()) {
          console.log('Ejecutando búsqueda con término:', termino);
          return this.ofertaService.buscarOfertas(termino);
        } else {
          console.log('Cargando todas las ofertas');
          return this.ofertaService.getOfertas();
        }
      })
    ).subscribe({
      next: (ofertas) => {
        console.log('Resultados de búsqueda:', ofertas.length, 'ofertas encontradas');
        console.log('Ofertas:', ofertas);
        this.ofertas = ofertas;
        this.ofertasFiltradas = ofertas;
      },
      error: (error) => {
        console.error('Error al buscar ofertas:', error);
        console.error('Detalles del error:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
      }
    });
  }

  ngOnInit(): void {
    this.cargarOfertas();
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarOfertas(): void {
    this.ofertaService.getOfertas().subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.ofertasFiltradas = ofertas;
      },
      error: (error) => {
        console.error('Error al cargar ofertas:', error);
      }
    });
  }

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categoriasDisponibles = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  buscarOfertas(): void {
    console.log('Buscando ofertas con término:', this.terminoBusqueda);
    this.searchSubject.next(this.terminoBusqueda);
  }

  probarBusqueda(): void {
    console.log('=== PRUEBA DE BÚSQUEDA ===');
    console.log('Término actual:', this.terminoBusqueda);
    console.log('Ofertas antes de búsqueda:', this.ofertas.length);
    
    // Hacer una búsqueda manual
    this.ofertaService.buscarOfertas(this.terminoBusqueda || 'test').subscribe({
      next: (ofertas) => {
        console.log('Resultado de búsqueda manual:', ofertas);
        console.log('Ofertas encontradas:', ofertas.length);
        this.ofertas = ofertas;
        this.ofertasFiltradas = ofertas;
      },
      error: (error) => {
        console.error('Error en búsqueda manual:', error);
      }
    });
  }

  eliminarOferta(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      this.ofertaService.eliminarOferta(id).subscribe({
        next: () => {
          this.cargarOfertas();
        },
        error: (error) => {
          console.error('Error al eliminar oferta:', error);
        }
      });
    }
  }

  activarOferta(id: string): void {
    this.ofertaService.activarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error) => {
        console.error('Error al activar oferta:', error);
      }
    });
  }

  desactivarOferta(id: string): void {
    this.ofertaService.desactivarOferta(id).subscribe({
      next: () => {
        this.cargarOfertas();
      },
      error: (error) => {
        console.error('Error al desactivar oferta:', error);
      }
    });
  }

  editarOferta(oferta: Oferta): void {
    this.ofertaEditando = { ...oferta };
    
    // Inicializar arrays de selección con los valores actuales
    this.productosSeleccionados = oferta.productosAplicables?.map(p => p._id || p) || [];
    this.categoriasSeleccionadas = oferta.categoriasAplicables?.map(c => c._id || c) || [];
    
    this.mostrarModal = true;
  }

  guardarCambios(): void {
    if (this.ofertaEditando && this.ofertaEditando._id) {
      // Crear objeto para enviar al backend con fechas convertidas a string
      const ofertaParaEnviar: any = {
        ...this.ofertaEditando,
        fechaInicio: new Date(this.ofertaEditando.fechaInicio).toISOString(),
        fechaFin: new Date(this.ofertaEditando.fechaFin).toISOString(),
        productosAplicables: this.productosSeleccionados,
        categoriasAplicables: this.categoriasSeleccionadas
      };

      this.ofertaService.editarOferta(this.ofertaEditando._id, ofertaParaEnviar).subscribe({
        next: () => {
          this.cargarOfertas();
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al editar oferta:', error);
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.ofertaEditando = null;
    this.mostrarModal = false;
    this.productosSeleccionados = [];
    this.categoriasSeleccionadas = [];
  }

  // Métodos para manejar selección múltiple
  toggleProducto(productoId: string): void {
    const index = this.productosSeleccionados.indexOf(productoId);
    if (index > -1) {
      this.productosSeleccionados.splice(index, 1);
    } else {
      this.productosSeleccionados.push(productoId);
    }
  }

  toggleCategoria(categoriaId: string): void {
    const index = this.categoriasSeleccionadas.indexOf(categoriaId);
    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      this.categoriasSeleccionadas.push(categoriaId);
    }
  }

  isProductoSeleccionado(productoId: string): boolean {
    return this.productosSeleccionados.includes(productoId);
  }

  isCategoriaSeleccionada(categoriaId: string): boolean {
    return this.categoriasSeleccionadas.includes(categoriaId);
  }

  validarImagen(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  getEstadoClass(estado: any): string {
    // Manejar diferentes tipos de datos para el estado
    if (estado === true || estado === 'true' || estado === 1 || estado === '1') {
      return 'activo';
    }
    return 'inactivo';
  }

  getEstadoTexto(estado: any): string {
    // Manejar diferentes tipos de datos para el estado
    if (estado === true || estado === 'true' || estado === 1 || estado === '1') {
      return 'Activo';
    }
    return 'Inactivo';
  }

  getTipoEstado(estado: any): string {
    return typeof estado;
  }

  formatearFecha(fecha: string | Date): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerNombresProductos(productos: any[]): string {
    if (!productos || productos.length === 0) {
      return 'Todos los productos';
    }
    
    const nombres = productos.map(producto => producto.nombre || 'Sin nombre');
    return nombres.join(', ');
  }

  obtenerNombresCategorias(categorias: any[]): string {
    if (!categorias || categorias.length === 0) {
      return 'Todas las categorías';
    }
    
    const nombres = categorias.map(categoria => categoria.nombre || 'Sin nombre');
    return nombres.join(', ');
  }

  esUrlValida(url: string): boolean {
    if (!url || url.trim() === '') {
      console.log('URL vacía o nula');
      return false;
    }
    try {
      new URL(url);
      console.log('URL válida:', url);
      return true;
    } catch (error) {
      console.log('URL inválida:', url, error);
      return false;
    }
  }

  onErrorImagen(event: any) {
    console.log('Error al cargar imagen:', event);
    console.log('Target src:', event.target?.src);
  }

  onLoadImagen(event: any) {
    console.log('Imagen cargada correctamente:', event.target?.src);
  }

  formatearFechaParaInput(fecha: string | Date): string {
    const fechaObj = new Date(fecha);
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    const hours = String(fechaObj.getHours()).padStart(2, '0');
    const minutes = String(fechaObj.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  actualizarFechaInicio(event: any) {
    if (this.ofertaEditando) {
      this.ofertaEditando.fechaInicio = new Date(event.target.value);
    }
  }

  actualizarFechaFin(event: any) {
    if (this.ofertaEditando) {
      this.ofertaEditando.fechaFin = new Date(event.target.value);
    }
  }
} 