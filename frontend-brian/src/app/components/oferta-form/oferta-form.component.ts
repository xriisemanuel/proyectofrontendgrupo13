/**
 * Componente de Formulario de Ofertas
 * 
 * Permite crear y editar ofertas del sistema:
 * - Formulario reactivo con validaciones
 * - Selección de productos y categorías aplicables
 * - Gestión de fechas de inicio y fin
 * - Validación de fechas automática
 * - Integración con servicios de backend
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-oferta-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './oferta-form.component.html',
  styleUrl: './oferta-form.component.css'
})
export class OfertaFormComponent implements OnInit {
  /** Formulario reactivo para la oferta */
  ofertaForm: FormGroup;
  
  /** Lista de productos disponibles */
  productos: Producto[] = [];
  
  /** Lista de categorías disponibles */
  categorias: Categoria[] = [];
  
  /** IDs de productos seleccionados */
  productosSeleccionados: string[] = [];
  
  /** IDs de categorías seleccionadas */
  categoriasSeleccionadas: string[] = [];
  
  /** Indica si es modo edición */
  esEdicion: boolean = false;
  
  /** ID de la oferta en edición */
  ofertaId: string | null = null;
  
  /** Estado de carga de datos */
  cargando: boolean = false;
  
  /** Estado de guardado */
  guardando: boolean = false;
  
  /** Mensaje de respuesta */
  mensaje: string = '';
  
  /** Mensaje de error de carga */
  errorCarga: string = '';

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Obtener fechas por defecto
    const hoy = new Date();
    const fechaInicio = hoy.toISOString().split('T')[0];
    const fechaFin = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 días después

    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      descuento: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      fechaInicio: [fechaInicio, Validators.required],
      fechaFin: [fechaFin, [Validators.required, this.fechaFinValidator.bind(this)]],
      imagen: [''],
      estado: [true]
    }, { validators: this.fechasValidator });
  }

  /**
   * Validador personalizado para fecha de fin
   * Verifica que la fecha de fin sea posterior a la fecha de inicio
   */
  fechaFinValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const fechaFin = new Date(control.value);
    const fechaInicio = this.ofertaForm?.get('fechaInicio')?.value;
    
    if (fechaInicio && fechaFin <= new Date(fechaInicio)) {
      return { fechaFinInvalida: true };
    }
    
    return null;
  }

  /**
   * Validador para ambas fechas
   * Verifica la coherencia entre fecha de inicio y fin
   */
  fechasValidator(group: AbstractControl): ValidationErrors | null {
    const fechaInicio = group.get('fechaInicio')?.value;
    const fechaFin = group.get('fechaFin')?.value;
    
    if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
      return { fechasInvalidas: true };
    }
    
    return null;
  }

  ngOnInit() {
    // Verificar permisos de administrador
    if (!this.authService.hasAdminPermissions()) {
      this.router.navigate(['/']);
      return;
    }

    // Obtener parámetros de la ruta
    this.ofertaId = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.ofertaId;

    // Cargar productos y categorías
    this.cargarProductos();
    this.cargarCategorias();

    // Si es edición, cargar la oferta
    if (this.esEdicion && this.ofertaId) {
      this.cargarOferta();
    }
  }

  /**
   * Carga la lista de productos disponibles
   */
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

  /**
   * Carga la lista de categorías disponibles
   */
  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.errorCarga = 'Error al cargar las categorías';
      }
    });
  }

  /**
   * Carga los datos de una oferta existente para edición
   */
  cargarOferta() {
    if (!this.ofertaId) return;

    this.cargando = true;
    this.errorCarga = '';

    this.ofertaService.getOfertaById(this.ofertaId).subscribe({
      next: (response: any) => {
        // Verificar si la respuesta es válida
        if (!response) {
          this.errorCarga = 'Error: Respuesta vacía del servidor';
          this.cargando = false;
          return;
        }
        
        // El backend devuelve la oferta directamente
        const oferta = response;
        
        // Verificar que la oferta tenga los campos necesarios
        if (!oferta.nombre) {
          this.errorCarga = 'Error: Datos de oferta incompletos';
          this.cargando = false;
          return;
        }
        
        // Actualizar productos y categorías seleccionados
        this.productosSeleccionados = oferta.productosAplicables?.map((p: any) => p._id || p) || [];
        this.categoriasSeleccionadas = oferta.categoriasAplicables?.map((c: any) => c._id || c) || [];
        
        // Convertir fechas a formato de input date
        const fechaInicio = oferta.fechaInicio ? new Date(oferta.fechaInicio).toISOString().split('T')[0] : '';
        const fechaFin = oferta.fechaFin ? new Date(oferta.fechaFin).toISOString().split('T')[0] : '';
        
        // Actualizar formulario
        this.ofertaForm.patchValue({
          nombre: oferta.nombre,
          descripcion: oferta.descripcion || '',
          descuento: oferta.descuento || 0,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          imagen: oferta.imagen || '',
          estado: oferta.estado !== undefined ? oferta.estado : true
        });
        
        this.cargando = false;
      },
      error: (error: any) => {
        this.cargando = false;
        if (error.status === 404) {
          this.errorCarga = 'Oferta no encontrada';
        } else {
          this.errorCarga = 'Error al cargar la oferta';
        }
      }
    });
  }

  /**
   * Alterna la selección de un producto
   * @param productoId - ID del producto a alternar
   */
  toggleProducto(productoId: string) {
    const index = this.productosSeleccionados.indexOf(productoId);
    if (index > -1) {
      this.productosSeleccionados.splice(index, 1);
    } else {
      this.productosSeleccionados.push(productoId);
    }
  }

  /**
   * Alterna la selección de una categoría
   * @param categoriaId - ID de la categoría a alternar
   */
  toggleCategoria(categoriaId: string) {
    const index = this.categoriasSeleccionadas.indexOf(categoriaId);
    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      this.categoriasSeleccionadas.push(categoriaId);
    }
  }

  /**
   * Guarda la oferta (crear o actualizar)
   */
  guardarOferta() {
    if (this.ofertaForm.valid && this.productosSeleccionados.length > 0 && this.categoriasSeleccionadas.length > 0) {
      this.guardando = true;
      this.mensaje = '';

      const ofertaData: Oferta = {
        ...this.ofertaForm.value,
        productosAplicables: this.productosSeleccionados,
        categoriasAplicables: this.categoriasSeleccionadas
      };

      if (this.esEdicion && this.ofertaId) {
        // Actualizar oferta existente
        this.ofertaService.editarOferta(this.ofertaId, ofertaData).subscribe({
          next: (response) => {
            this.mensaje = 'Oferta actualizada exitosamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/ofertas']);
            }, 1500);
          },
          error: (error) => {
            this.mensaje = 'Error al actualizar la oferta';
            this.guardando = false;
          }
        });
      } else {
        // Crear nueva oferta
        this.ofertaService.crearOferta(ofertaData).subscribe({
          next: (response) => {
            this.mensaje = 'Oferta creada exitosamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/ofertas']);
            }, 1500);
          },
          error: (error) => {
            this.mensaje = 'Error al crear la oferta';
            this.guardando = false;
          }
        });
      }
    }
  }

  /**
   * Navega de vuelta a la lista de ofertas
   */
  volverAtras() {
    this.router.navigate(['/ofertas']);
  }

  /**
   * Valida si una URL es válida
   * @param url - URL a validar
   * @returns true si la URL es válida
   */
  esUrlValida(url: string): boolean {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
} 