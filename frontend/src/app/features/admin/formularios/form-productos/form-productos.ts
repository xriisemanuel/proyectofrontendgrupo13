import { Component, OnInit } from '@angular/core';
import { Categoria } from '../../../../data/services/categoria'; // Corrige la ruta según tu estructura de carpetas
import { Producto } from '../../../../data/services/producto'; // Corrige la ruta y el nombre de clase
import { Unplash } from '../../../admin/services/unplash'; // Corrige la ruta
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Openfood } from '../../../admin/services/openfood'; // Corrige la ruta
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-productos.html',
  styleUrl: './form-productos.css'
})
export class FormProducto implements OnInit {
  producto: any = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagenes: [''],
    popularidad: 0,
    categoriaId: ''
  };

  categorias: any[] = [];
  modoEdicion = false;
  productoId = '';
  mensajeModal = ''; // Se mantiene si lo usas en otros modales que no sean Swal
  imagenSugerida = '';
  recetaSugerida: any = null;
  ingredientesSugeridos: string[] = [];

  constructor(
    private productoService: Producto, // Inyecta Producto
    private categoriaService: Categoria, // Inyecta Categoria
    private unsplashService: Unplash,
    private router: Router,
    private route: ActivatedRoute,
    private openFoodService: Openfood
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();

    this.productoId = this.route.snapshot.paramMap.get('id') ?? '';
    this.modoEdicion = !!this.productoId;

    if (this.modoEdicion) {
      this.productoService.getProductoPorId(this.productoId).subscribe(data => {
        this.producto = { ...data };
        if (!this.producto.imagenes || this.producto.imagenes.length === 0) {
          this.producto.imagenes = [''];
        }
      });
    }
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe(data => {
      this.categorias = data;
    });
  }

  guardar(): void {
    // Validaciones básicas antes de enviar
    if (!this.producto.nombre || !this.producto.precio || !this.producto.stock || !this.producto.categoriaId || this.producto.imagenes.some((img: string) => !img)) {
      Swal.fire('Error', 'Por favor, complete todos los campos obligatorios y asegúrese de que las imágenes no estén vacías.', 'error');
      return;
    }

    const operacion = this.modoEdicion
      ? this.productoService.actualizarProducto(this.productoId, this.producto)
      : this.productoService.crearProducto(this.producto);

    operacion.subscribe({
      next: () => {
        const mensaje = this.modoEdicion
          ? 'Producto actualizado correctamente'
          : 'Producto creado correctamente';

        Swal.fire('¡Éxito!', mensaje, 'success');
        setTimeout(() => this.router.navigate(['/admin/productos/manage']), 1500); // Redirige al dashboard de gestión
      },
      error: (err) => {
        console.error('Error al guardar producto:', err);
        Swal.fire('Error', err.error?.mensaje || 'Error al guardar el producto.', 'error');
      }
    });
  }

  agregarImagen(): void {
    this.producto.imagenes.push('');
  }

  quitarImagen(index: number): void {
    this.producto.imagenes.splice(index, 1);
  }

  buscarImagenSugerida(): void {
    if (!this.producto.nombre) {
      Swal.fire('Advertencia', 'Por favor, ingresa un nombre de producto para sugerir una imagen.', 'warning');
      return;
    }
    this.unsplashService.buscarImagen(this.producto.nombre).subscribe({
      next: res => {
        const url = res.results[0]?.urls?.regular || '';
        if (url) {
          this.imagenSugerida = url;
          Swal.fire('Imagen Sugerida', 'Se encontró una imagen. Puedes usarla o buscar otra.', 'info');
        } else {
          Swal.fire('No se encontró', 'No se encontraron imágenes sugeridas para este nombre.', 'info');
        }
      },
      error: (err) => {
        console.error('Error al buscar imagen sugerida:', err);
        Swal.fire('Error', 'Error al buscar imagen sugerida. Intente de nuevo.', 'error');
      }
    });
  }

  agregarImagenSugerida(): void {
    if (this.imagenSugerida && !this.producto.imagenes.includes(this.imagenSugerida)) {
      this.producto.imagenes.push(this.imagenSugerida);
      Swal.fire('Agregada', 'Imagen sugerida añadida a la lista.', 'success');
    } else if (this.producto.imagenes.includes(this.imagenSugerida)) {
      Swal.fire('Advertencia', 'Esta imagen ya está en la lista.', 'warning');
    } else {
      Swal.fire('Advertencia', 'No hay imagen sugerida para agregar.', 'warning');
    }
  }

  // El método mostrarModal ya no es necesario si usas Swal directamente en guardar()
  // Si lo usas en otros lugares, asegúrate de que use Swal.fire()

  volver(): void {
    this.router.navigate(['/admin/productos/manage']); // Siempre vuelve a la lista de gestión de productos
  }

  generarReceta(nombreOriginal: string): void {
    if (!nombreOriginal) {
      Swal.fire('Advertencia', 'Por favor, ingresa un nombre de producto para generar una receta.', 'warning');
      return;
    }
    const nombreTraducido = this.traducirNombre(nombreOriginal);

    this.openFoodService.buscarReceta(nombreTraducido).subscribe({
      next: res => {
        const receta = res.meals ? res.meals[0] : null;
        this.recetaSugerida = receta;
        this.ingredientesSugeridos = [];

        if (receta) {
          for (let i = 1; i <= 20; i++) {
            const ing = receta['strIngredient' + i];
            const med = receta['strMeasure' + i];
            if (ing && ing.trim()) {
              this.ingredientesSugeridos.push(`${ing.trim()} ${med ? '- ' + med.trim() : ''}`);
            }
          }
          Swal.fire('Receta Sugerida', 'Se encontró una receta. Puedes usarla como descripción.', 'info');
        } else {
          Swal.fire('No se encontró', 'No se encontraron recetas sugeridas para este nombre.', 'info');
        }
      },
      error: (err) => {
        console.error('Error al buscar receta sugerida:', err);
        Swal.fire('Error', 'Error al buscar receta sugerida. Intente de nuevo.', 'error');
      }
    });
  }

  traducirNombre(nombre: string): string {
    const traducciones: Record<string, string> = {
      'milanesa': 'breaded cutlet',
      'tarta': 'pie',
      'ensalada': 'salad',
      'empanada': 'turnover',
      'tortilla': 'omelette'
    };
    return traducciones[nombre.toLowerCase()] || nombre;
  }

  usarRecetaComoDescripcion(): void {
    if (!this.recetaSugerida?.strMeal || !this.ingredientesSugeridos.length) {
      Swal.fire('Advertencia', 'No hay receta sugerida para usar como descripción.', 'warning');
      return;
    }

    this.producto.descripcion = '';

    let descripcion = `Receta sugerida: ${this.recetaSugerida.strMeal}\n`;
    descripcion += `Categoría: ${this.recetaSugerida.strCategory}\n`;
    descripcion += `Origen: ${this.recetaSugerida.strArea}\n\n`;

    descripcion += 'Ingredientes:\n';
    this.ingredientesSugeridos.forEach(ing => {
      descripcion += `- ${ing}\n`;
    });

    if (this.recetaSugerida.strInstructions) {
      descripcion += `\nInstrucciones:\n${this.recetaSugerida.strInstructions}`;
    }

    this.producto.descripcion = descripcion;
    Swal.fire('Descripción Generada', 'La descripción del producto ha sido actualizada con la receta sugerida.', 'success');
  }

  limpiarDescripcion(): void {
    this.producto.descripcion = '';
    Swal.fire('Limpiado', 'La descripción del producto ha sido limpiada.', 'info');
  }
}
