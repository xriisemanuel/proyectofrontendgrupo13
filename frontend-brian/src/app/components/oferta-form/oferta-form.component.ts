import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';

@Component({
  selector: 'app-oferta-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './oferta-form.component.html'
})
export class OfertaFormComponent implements OnInit {
  ofertaForm: FormGroup;
  mensaje: string = '';
  error: string = '';
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  productosSeleccionados: string[] = [];
  categoriasSeleccionadas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService
  ) {
    this.ofertaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      descuento: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      imagen: [''],
      productosAplicables: [[]],
      categoriasAplicables: [[]],
      estado: [true]
    });
  }

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
    
    // Validación personalizada para fechaFin
    this.ofertaForm.get('fechaInicio')?.valueChanges.subscribe(() => {
      this.validarFechas();
    });
    
    this.ofertaForm.get('fechaFin')?.valueChanges.subscribe(() => {
      this.validarFechas();
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        console.log('Productos cargados:', data);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('Categorías cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
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
    this.ofertaForm.patchValue({ productosAplicables: this.productosSeleccionados });
    console.log('Productos seleccionados:', this.productosSeleccionados);
  }

  toggleCategoria(categoriaId: string) {
    const index = this.categoriasSeleccionadas.indexOf(categoriaId);
    if (index > -1) {
      this.categoriasSeleccionadas.splice(index, 1);
    } else {
      this.categoriasSeleccionadas.push(categoriaId);
    }
    this.ofertaForm.patchValue({ categoriasAplicables: this.categoriasSeleccionadas });
    console.log('Categorías seleccionadas:', this.categoriasSeleccionadas);
  }

  isProductoSeleccionado(productoId: string): boolean {
    return this.productosSeleccionados.includes(productoId);
  }

  isCategoriaSeleccionada(categoriaId: string | undefined): boolean {
    if (!categoriaId) return false;
    return this.categoriasSeleccionadas.includes(categoriaId);
  }

  validarFechas() {
    const fechaInicio = this.ofertaForm.get('fechaInicio')?.value;
    const fechaFin = this.ofertaForm.get('fechaFin')?.value;
    
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      if (fin < inicio) {
        this.ofertaForm.get('fechaFin')?.setErrors({ fechaInvalida: true });
      } else {
        this.ofertaForm.get('fechaFin')?.setErrors(null);
      }
    }
  }

  onSubmit() {
    if (this.ofertaForm.valid) {
      const ofertaData = this.ofertaForm.value;
      
      // Convertir fechas de string a Date
      ofertaData.fechaInicio = new Date(ofertaData.fechaInicio);
      ofertaData.fechaFin = new Date(ofertaData.fechaFin);
      
      console.log('Datos de oferta a enviar:', ofertaData);
      console.log('Estado del formulario:', {
        valor: ofertaData.estado,
        tipo: typeof ofertaData.estado,
        booleano: Boolean(ofertaData.estado)
      });
      
      this.ofertaService.crearOferta(ofertaData).subscribe({
        next: (response) => {
          console.log('Oferta creada exitosamente:', response);
          this.mensaje = 'Oferta creada exitosamente';
          this.error = '';
          this.ofertaForm.reset({ estado: true });
          this.productosSeleccionados = [];
          this.categoriasSeleccionadas = [];
        },
        error: (error) => {
          console.error('Error al crear oferta:', error);
          this.error = error.error?.mensaje || 'Error al crear la oferta';
          this.mensaje = '';
        }
      });
    } else {
      console.log('Formulario inválido:', this.ofertaForm.errors);
      this.error = 'Por favor, completa todos los campos requeridos correctamente';
      this.mensaje = '';
    }
  }

  getError(field: string): string {
    const control = this.ofertaForm.get(field);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${field} es requerido`;
      if (control.errors['minlength']) return `${field} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `${field} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['min']) return `${field} debe ser mayor o igual a ${control.errors['min'].min}`;
      if (control.errors['max']) return `${field} debe ser menor o igual a ${control.errors['max'].max}`;
      if (control.errors['fechaInvalida']) return 'La fecha de fin debe ser posterior o igual a la fecha de inicio';
    }
    return '';
  }
} 