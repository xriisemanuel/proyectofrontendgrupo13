import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth'; // Asegúrate de que la ruta sea './services/auth'
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
    const hoy = new Date();
    const fechaInicio = hoy.toISOString().split('T')[0];
    const fechaFin = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

  fechaFinValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const fechaFin = new Date(control.value);
    const fechaInicio = this.ofertaForm?.get('fechaInicio')?.value;
    
    if (fechaInicio && fechaFin <= new Date(fechaInicio)) {
      return { fechaFinInvalida: true };
    }
    
    return null;
  }

  fechasValidator(group: AbstractControl): ValidationErrors | null {
    const fechaInicio = group.get('fechaInicio')?.value;
    const fechaFin = group.get('fechaFin')?.value;
    
    if (fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio)) {
      return { fechasInvalidas: true };
    }
    
    return null;
  }

  ngOnInit() {
    if (!this.authService.hasAdminPermissions()) {
      this.router.navigate(['/']);
      return;
    }

    this.ofertaId = this.route.snapshot.paramMap.get('id');
    this.esEdicion = !!this.ofertaId;

    console.log('OfertaFormComponent inicializado');
    console.log('Es edición:', this.esEdicion);
    console.log('ID de oferta:', this.ofertaId);
    // --- CAMBIO AQUÍ: isLoggedIn() a isAuthenticated() ---
    console.log('Usuario autenticado:', this.authService.isAuthenticated()); 
    // --- CAMBIO AQUÍ: getCurrentRole() a getRole() ---
    console.log('Rol actual:', this.authService.getRole()); 
    console.log('Token disponible:', !!this.authService.getToken()); 

    this.cargarProductos();
    this.cargarCategorias();

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

    this.ofertaService.getOfertaById(this.ofertaId).subscribe({
      next: (oferta: Oferta) => {
        if (!oferta) {
          console.error('Respuesta vacía del backend');
          this.errorCarga = 'Error: Respuesta vacía del servidor';
          this.cargando = false;
          return;
        }
        
        this.productosSeleccionados = oferta.productosAplicables?.map((p: any) => (typeof p === 'object' && p !== null) ? p._id : p) || [];
        this.categoriasSeleccionadas = oferta.categoriasAplicables?.map((c: any) => (typeof c === 'object' && c !== null) ? c._id : c) || [];
        
        const fechaInicio = oferta.fechaInicio ? new Date(oferta.fechaInicio).toISOString().split('T')[0] : '';
        const fechaFin = oferta.fechaFin ? new Date(oferta.fechaFin).toISOString().split('T')[0] : '';
        
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
        console.error('Error al cargar oferta:', error);
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

      const ofertaData: Oferta = {
        ...this.ofertaForm.value,
        fechaInicio: new Date(this.ofertaForm.value.fechaInicio!),
        fechaFin: new Date(this.ofertaForm.value.fechaFin!),
        productosAplicables: this.productosSeleccionados,
        categoriasAplicables: this.categoriasSeleccionadas
      } as Oferta;

      if (this.esEdicion && this.ofertaId) {
        this.ofertaService.editarOferta(this.ofertaId, ofertaData).subscribe({
          next: () => {
            this.mensaje = 'Oferta actualizada correctamente';
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
        this.ofertaService.crearOferta(ofertaData).subscribe({
          next: () => {
            this.mensaje = 'Oferta creada correctamente';
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
      this.mensaje = 'Formulario inválido. Revisa los campos.';
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
