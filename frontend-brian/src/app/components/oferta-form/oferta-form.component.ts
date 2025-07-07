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
  ofertaForm: FormGroup;
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  productosSeleccionados: string[] = [];
  categoriasSeleccionadas: string[] = [];
  esEdicion: boolean = false;
  ofertaId: string | null = null;
  cargando: boolean = false;
  guardando: boolean = false;
  mensaje: string = '';
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

  // Validador personalizado para fecha de fin
  fechaFinValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const fechaFin = new Date(control.value);
    const fechaInicio = this.ofertaForm?.get('fechaInicio')?.value;
    
    if (fechaInicio && fechaFin <= new Date(fechaInicio)) {
      return { fechaFinInvalida: true };
    }
    
    return null;
  }

  // Validador para ambas fechas
  fechasValidator(group: AbstractControl): ValidationErrors | null {
    const fechaInicio = group.get('fechaInicio')?.value;
    const fechaFin = group.get('fechaFin')?.value;
    
    if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
      return { fechasInvalidas: true };
    }
    
    return null;
  }

  ngOnInit() {
    // Verificar permisos
    if (!this.authService.hasAdminPermissions()) {
      this.router.navigate(['/']);
      return;
    }

    // Obtener parámetros de la ruta
    this.ofertaId = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.ofertaId;

    console.log('OfertaFormComponent inicializado');
    console.log('Es edición:', this.esEdicion);
    console.log('ID de oferta:', this.ofertaId);
    console.log('Usuario autenticado:', this.authService.isLoggedIn());
    console.log('Rol actual:', this.authService.getCurrentRole());
    console.log('Token disponible:', !!localStorage.getItem('token'));

    // Cargar productos y categorías
    this.cargarProductos();
    this.cargarCategorias();

    // Si es edición, cargar la oferta
    if (this.esEdicion && this.ofertaId) {
      this.cargarOferta();
    }
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

  cargarOferta() {
    if (!this.ofertaId) return;

    this.cargando = true;
    this.errorCarga = '';

    console.log('Intentando cargar oferta con ID:', this.ofertaId);

    this.ofertaService.getOfertaById(this.ofertaId).subscribe({
      next: (response: any) => {
        console.log('Respuesta del backend:', response);
        console.log('Tipo de respuesta:', typeof response);
        console.log('¿Es array?', Array.isArray(response));
        
        // Verificar si la respuesta es válida
        if (!response) {
          console.error('Respuesta vacía del backend');
          this.errorCarga = 'Error: Respuesta vacía del servidor';
          this.cargando = false;
          return;
        }
        
        // El backend devuelve la oferta directamente, no dentro de un objeto 'oferta'
        const oferta = response;
        
        console.log('Oferta extraída:', oferta);
        console.log('Productos aplicables:', oferta.productosAplicables);
        console.log('Categorías aplicables:', oferta.categoriasAplicables);
        
        // Verificar que la oferta tenga los campos necesarios
        if (!oferta.nombre) {
          console.error('Oferta sin nombre:', oferta);
          this.errorCarga = 'Error: Datos de oferta incompletos';
          this.cargando = false;
          return;
        }
        
        // Actualizar productos y categorías seleccionados
        this.productosSeleccionados = oferta.productosAplicables?.map((p: any) => p._id || p) || [];
        this.categoriasSeleccionadas = oferta.categoriasAplicables?.map((c: any) => c._id || c) || [];
        
        console.log('Productos seleccionados:', this.productosSeleccionados);
        console.log('Categorías seleccionadas:', this.categoriasSeleccionadas);
        
        // Convertir fechas a formato de input date
        const fechaInicio = oferta.fechaInicio ? new Date(oferta.fechaInicio).toISOString().split('T')[0] : '';
        const fechaFin = oferta.fechaFin ? new Date(oferta.fechaFin).toISOString().split('T')[0] : '';
        
        console.log('Fechas convertidas:', { fechaInicio, fechaFin });
        
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
        
        console.log('Formulario actualizado:', this.ofertaForm.value);
        
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar oferta:', error);
        console.error('Status:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('Error completo:', error);
        
        this.cargando = false;
        
        if (error.status === 401) {
          this.errorCarga = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          this.errorCarga = 'No tienes permisos para acceder a esta oferta.';
        } else if (error.status === 404) {
          this.errorCarga = 'Oferta no encontrada.';
        } else if (error.status === 500) {
          this.errorCarga = 'Error interno del servidor.';
        } else {
          this.errorCarga = `Error al cargar la oferta: ${error.message || 'Error desconocido'}`;
        }
      }
    });
  }

  toggleProducto(productoId: string) {
    const index = this.productosSeleccionados.indexOf(productoId);
    if (index > -1) {
      this.productosSeleccionados.splice(index, 1);
    } else {
      this.productosSeleccionados.push(productoId);
    }
  }

  toggleCategoria(categoriaId: string) {
    const index = this.categoriasSeleccionadas.indexOf(categoriaId);
    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      this.categoriasSeleccionadas.push(categoriaId);
    }
  }

  guardarOferta() {
    if (this.ofertaForm.valid) {
      this.guardando = true;
      this.mensaje = '';

      const ofertaData = {
        ...this.ofertaForm.value,
        fechaInicio: new Date(this.ofertaForm.value.fechaInicio).toISOString(),
        fechaFin: new Date(this.ofertaForm.value.fechaFin).toISOString(),
        productosAplicables: this.productosSeleccionados,
        categoriasAplicables: this.categoriasSeleccionadas
      };

      if (this.esEdicion && this.ofertaId) {
        // Actualizar oferta existente
        this.ofertaService.editarOferta(this.ofertaId, ofertaData).subscribe({
          next: (response: any) => {
            this.mensaje = response.mensaje || 'Oferta actualizada correctamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/ofertas']);
            }, 1500);
          },
          error: (error) => {
            this.mensaje = error.error?.mensaje || 'Error al actualizar la oferta';
            this.guardando = false;
          }
        });
      } else {
        // Crear nueva oferta
        this.ofertaService.crearOferta(ofertaData).subscribe({
          next: (response: any) => {
            this.mensaje = response.mensaje || 'Oferta creada correctamente';
            this.guardando = false;
            setTimeout(() => {
              this.router.navigate(['/ofertas']);
            }, 1500);
          },
          error: (error: any) => {
            this.mensaje = error.error?.mensaje || 'Error al crear la oferta';
            this.guardando = false;
          }
        });
      }
    } else {
      console.log('Formulario inválido:', this.ofertaForm.errors);
      console.log('Errores por campo:', {
        nombre: this.ofertaForm.get('nombre')?.errors,
        descuento: this.ofertaForm.get('descuento')?.errors,
        fechaInicio: this.ofertaForm.get('fechaInicio')?.errors,
        fechaFin: this.ofertaForm.get('fechaFin')?.errors
      });
    }
  }

  volverAtras() {
    this.router.navigate(['/ofertas']);
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
} 