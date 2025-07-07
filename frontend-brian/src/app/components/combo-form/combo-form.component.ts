import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComboService, Combo, ProductoEnCombo } from '../../services/combo.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  precio: number;
  unidades: number;
}

@Component({
  selector: 'app-combo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './combo-form.component.html',
  styleUrl: './combo-form.component.css'
})
export class ComboFormComponent implements OnInit {
  comboForm: FormGroup;
  productos: Producto[] = [];
  productosSeleccionados: ProductoSeleccionado[] = [];
  esEdicion: boolean = false;
  comboId: string | null = null;
  cargando: boolean = false;
  guardando: boolean = false;
  mensaje: string = '';
  errorCarga: string = '';
  
  // Propiedades calculadas
  precioTotalSinDescuento: number = 0;
  precioFinalConDescuento: number = 0;
  ahorroTotal: number = 0;

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private productoService: ProductoService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.comboForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      descuento: [0, [Validators.min(0), Validators.max(100)]],
      imagen: [''],
      estado: [true]
    });
  }

  ngOnInit() {
    // Verificar permisos
    if (!this.authService.hasAdminPermissions()) {
      this.router.navigate(['/']);
      return;
    }

    // Obtener parámetros de la ruta
    this.comboId = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.comboId;

    // Cargar productos
    this.cargarProductos();

    // Si es edición, cargar el combo
    if (this.esEdicion && this.comboId) {
      this.cargarCombo();
    }

    // Suscribirse a cambios en el descuento para recalcular precios
    this.comboForm.get('descuento')?.valueChanges.subscribe(() => {
      this.calcularPrecios();
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.errorCarga = 'Error al cargar los productos';
      }
    });
  }

  cargarCombo() {
    if (!this.comboId) return;

    this.cargando = true;
    this.errorCarga = '';

    this.comboService.getComboById(this.comboId).subscribe({
      next: (response: any) => {
        const combo = response.combo;
        
        // Actualizar productos seleccionados con el nuevo formato
        if (combo.productos && Array.isArray(combo.productos)) {
          this.productosSeleccionados = combo.productos.map((producto: ProductoEnCombo) => {
            const productoInfo = this.productos.find(p => p._id === producto.productoId);
            return {
              id: producto.productoId,
              nombre: productoInfo?.nombre || 'Producto no encontrado',
              precio: productoInfo?.precio || 0,
              unidades: producto.unidades
            };
          });
        }
        
        // Actualizar formulario
        this.comboForm.patchValue({
          nombre: combo.nombre,
          descripcion: combo.descripcion,
          descuento: combo.descuento,
          imagen: combo.imagen,
          estado: combo.estado
        });
        
        this.calcularPrecios();
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        if (error.status === 404) {
          this.errorCarga = 'Combo no encontrado';
        } else {
          this.errorCarga = 'Error al cargar el combo';
        }
      }
    });
  }

  toggleProducto(productoId: string) {
    const index = this.productosSeleccionados.findIndex(p => p.id === productoId);
    if (index > -1) {
      this.productosSeleccionados.splice(index, 1);
    } else {
      const producto = this.productos.find(p => p._id === productoId);
      if (producto) {
        this.productosSeleccionados.push({
          id: productoId,
          nombre: producto.nombre,
          precio: producto.precio,
          unidades: 1
        });
      }
    }
    
    this.calcularPrecios();
  }

  cambiarUnidades(productoId: string, unidades: number) {
    const producto = this.productosSeleccionados.find(p => p.id === productoId);
    if (producto) {
      producto.unidades = Math.max(1, unidades);
      this.calcularPrecios();
    }
  }

  onUnidadesChange(event: Event, productoId: string) {
    const target = event.target as HTMLInputElement;
    const unidades = parseInt(target.value) || 1;
    this.cambiarUnidades(productoId, unidades);
  }

  calcularPrecios() {
    // Calcular precio total sin descuento
    this.precioTotalSinDescuento = this.productosSeleccionados.reduce((total, producto) => {
      return total + (producto.precio * producto.unidades);
    }, 0);

    // Obtener descuento del formulario
    const descuento = this.comboForm.get('descuento')?.value || 0;

    // Calcular precio final con descuento
    this.precioFinalConDescuento = this.precioTotalSinDescuento * (1 - descuento / 100);
    this.ahorroTotal = this.precioTotalSinDescuento - this.precioFinalConDescuento;
  }

  guardarCombo() {
    if (this.comboForm.valid && this.productosSeleccionados.length > 0) {
      this.guardando = true;
      this.mensaje = '';

      // Preparar datos en el nuevo formato
      const comboData: Combo = {
        ...this.comboForm.value,
        productos: this.productosSeleccionados.map(producto => ({
          productoId: producto.id,
          unidades: producto.unidades
        }))
      };

      if (this.esEdicion && this.comboId) {
        // Actualizar combo existente
        this.comboService.updateCombo(this.comboId, comboData).subscribe({
          next: (response: any) => {
            this.mensaje = 'Combo actualizado correctamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/combos']);
            }, 1500);
          },
          error: (error) => {
            this.mensaje = 'Error al actualizar el combo';
            this.guardando = false;
          }
        });
      } else {
        // Crear nuevo combo
        this.comboService.addCombo(comboData).subscribe({
          next: (response: any) => {
            this.mensaje = 'Combo creado correctamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/combos']);
            }, 1500);
          },
          error: (error: any) => {
            this.mensaje = 'Error al crear el combo';
            this.guardando = false;
          }
        });
      }
    } else if (this.productosSeleccionados.length === 0) {
      this.mensaje = 'Debes seleccionar al menos un producto';
    }
  }

  volverAtras() {
    this.router.navigate(['/combos']);
  }

  esUrlValida(url: string): boolean {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Métodos para el template
  isProductoSeleccionado(productoId: string): boolean {
    return this.productosSeleccionados.some(p => p.id === productoId);
  }

  getProductoSeleccionado(productoId: string): ProductoSeleccionado | undefined {
    return this.productosSeleccionados.find(p => p.id === productoId);
  }

  getUnidadesProducto(productoId: string): number {
    const producto = this.getProductoSeleccionado(productoId);
    return producto ? producto.unidades : 1;
  }

  getSubtotalProducto(producto: Producto): number {
    const unidades = this.getUnidadesProducto(producto._id);
    return producto.precio * unidades;
  }
}
