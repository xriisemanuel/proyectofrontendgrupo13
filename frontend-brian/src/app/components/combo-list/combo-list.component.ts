import { Component, OnInit } from '@angular/core';
import { ComboService, Combo } from '../../services/combo.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-combo-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit {
  combos: Combo[] = [];
  productos: Producto[] = [];
  mostrarModal: boolean = false;
  comboForm: FormGroup;
  mensaje: string = '';
  comboEditandoId: string | null = null;
  terminoBusqueda: string = '';
  combosFiltrados: Combo[] = [];

  constructor(private comboService: ComboService, private productoService: ProductoService, private fb: FormBuilder) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      productosIds: [[], Validators.required],
      precioCombo: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: [''],
      estado: [true]
    });
  }

  ngOnInit() {
    this.comboService.getCombos().subscribe({
      next: (data) => {
        this.combos = data;
        this.combosFiltrados = data;
      },
      error: () => this.combos = []
    });
    this.productoService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: () => this.productos = []
    });
  }

  eliminarCombo(id: string) {
    console.log('Eliminando combo con ID:', id);
    this.comboService.deleteCombo(id).subscribe({
      next: (response) => {
        console.log('Respuesta de eliminación:', response);
        // Actualizar ambas listas en tiempo real
        this.combos = this.combos.filter(combo => combo._id !== id);
        this.combosFiltrados = this.combosFiltrados.filter(combo => combo._id !== id);
        console.log('Listas actualizadas después de eliminar');
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el combo');
      }
    });
  }

  activarCombo(id: string) {
    console.log('Activando combo con ID:', id);
    this.comboService.activarCombo(id).subscribe({
      next: (response: any) => {
        console.log('Respuesta de activación:', response);
        // Extraer el combo de la respuesta del backend
        const comboActualizado = response.combo;
        // Actualizar el combo en ambas listas
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error) => {
        console.error('Error al activar:', error);
        alert('Error al activar el combo');
      }
    });
  }

  desactivarCombo(id: string) {
    console.log('Desactivando combo con ID:', id);
    this.comboService.desactivarCombo(id).subscribe({
      next: (response: any) => {
        console.log('Respuesta de desactivación:', response);
        // Extraer el combo de la respuesta del backend
        const comboActualizado = response.combo;
        // Actualizar el combo en ambas listas
        this.actualizarComboEnListas(id, comboActualizado);
      },
      error: (error) => {
        console.error('Error al desactivar:', error);
        alert('Error al desactivar el combo');
      }
    });
  }

  actualizarComboEnListas(id: string, comboActualizado: any) {
    console.log('Actualizando combo en listas:', id, comboActualizado);
    
    // Actualizar en la lista principal
    const indexPrincipal = this.combos.findIndex(combo => combo._id === id);
    if (indexPrincipal !== -1) {
      this.combos[indexPrincipal] = comboActualizado;
      console.log('Combo actualizado en lista principal');
    }
    
    // Actualizar en la lista filtrada
    const indexFiltrado = this.combosFiltrados.findIndex(combo => combo._id === id);
    if (indexFiltrado !== -1) {
      this.combosFiltrados[indexFiltrado] = comboActualizado;
      console.log('Combo actualizado en lista filtrada');
    }
  }

  obtenerCombo(id: string) {
    this.comboService.getComboById(id).subscribe({
      next: (response: any) => {
        const combo = response.combo;
        alert(JSON.stringify(combo, null, 2));
      },
      error: () => alert('Error al obtener el combo')
    });
  }

  editarCombo(id: string) {
    this.comboService.getComboById(id).subscribe({
      next: (response: any) => {
        console.log('Respuesta completa del backend:', response);
        const combo = response.combo; // Acceder al combo dentro de la respuesta
        console.log('Datos del combo extraídos:', combo);
        this.comboEditandoId = id;
        this.comboForm.patchValue({
          nombre: combo.nombre,
          descripcion: combo.descripcion,
          productosIds: combo.productosIds,
          precioCombo: combo.precioCombo,
          descuento: combo.descuento,
          imagen: combo.imagen,
          estado: combo.estado
        });
        console.log('Formulario después de patchValue:', this.comboForm.value);
        this.mostrarModal = true;
      },
      error: () => alert('Error al obtener combo para editar')
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.comboEditandoId = null;
    this.comboForm.reset({ estado: true, descuento: 0, precioCombo: 0, productosIds: [] });
    this.mensaje = '';
  }

  guardarEdicion() {
    if (this.comboForm.valid && this.comboEditandoId) {
      this.comboService.updateCombo(this.comboEditandoId, this.comboForm.value).subscribe({
        next: (response: any) => {
          this.mensaje = 'Combo actualizado correctamente';
          // Extraer el combo de la respuesta del backend
          const comboActualizado = response.combo;
          // Actualizar el combo en ambas listas en tiempo real
          this.actualizarComboEnListas(this.comboEditandoId!, comboActualizado);
          setTimeout(() => this.cerrarModal(), 1000);
        },
        error: () => {
          this.mensaje = 'Error al actualizar combo';
        }
      });
    }
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
      this.combosFiltrados = [...this.combos]; // Usar spread operator para crear una copia
      return;
    }
    
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.combosFiltrados = this.combos.filter(combo => 
      combo.nombre.toLowerCase().includes(termino) ||
      combo.descripcion.toLowerCase().includes(termino) ||
      this.obtenerNombresProductos(combo.productosIds).toLowerCase().includes(termino)
    );
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.combosFiltrados = [...this.combos]; // Usar spread operator para crear una copia
  }

  onErrorImagen(event: any) {
    console.log('Error al cargar imagen:', event.target.src);
    
    // Ocultar la imagen que falló
    event.target.style.display = 'none';
    
    // Buscar si ya existe un mensaje de error
    let errorSpan = event.target.parentNode.querySelector('.error-imagen');
    
    // Si no existe, crear uno nuevo
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'error-imagen';
      errorSpan.textContent = 'Imagen no disponible';
      event.target.parentNode.appendChild(errorSpan);
    }
  }

  onLoadImagen(event: any) {
    console.log('Imagen cargada exitosamente:', event.target.src);
    // Remover cualquier mensaje de error si existía
    const errorSpan = event.target.parentNode.querySelector('.error-imagen');
    if (errorSpan) {
      errorSpan.remove();
    }
  }

  esUrlValida(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    
    try {
      // Intentar crear un objeto URL para validar
      new URL(url);
      
      // Verificar que sea HTTP o HTTPS
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      console.log('URL inválida:', url);
      return false;
    }
  }
}
