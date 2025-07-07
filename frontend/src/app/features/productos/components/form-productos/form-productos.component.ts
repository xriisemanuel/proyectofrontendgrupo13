import { Component, OnInit } from '@angular/core';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { UnplashService } from '../../services/unplash.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OpenfoodService } from '../../services/openfood.service';


@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-productos.component.html',
  styleUrl: './form-productos.component.css'
})
export class FormProductoComponent implements OnInit {
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
  mensajeModal = '';
  imagenSugerida = '';
  recetaSugerida: any = null;
ingredientesSugeridos: string[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private unsplashService: UnplashService,
    private router: Router,
    private route: ActivatedRoute,
    private openFoodService: OpenfoodService
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();

    // Si hay ID en la URL, estamos editando
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
    const operacion = this.modoEdicion
      ? this.productoService.actualizarProducto(this.productoId, this.producto)
      : this.productoService.crearProducto(this.producto);

    operacion.subscribe(() => {
      const mensaje = this.modoEdicion
        ? 'Producto actualizado correctamente'
        : 'Producto creado correctamente';

      this.mostrarModal(mensaje);
      setTimeout(() => this.router.navigate(['productos']), 2000);
    });
  }

  agregarImagen(): void {
    this.producto.imagenes.push('');
  }

  quitarImagen(index: number): void {
    this.producto.imagenes.splice(index, 1);
  }

  //API GENERAR URL UNPLASH
buscarImagenSugerida(): void {
  if (!this.producto.nombre) return;

  this.unsplashService.buscarImagen(this.producto.nombre).subscribe(res => {
    const url = res.results[0]?.urls?.regular || '';
    this.imagenSugerida = url;
  });
}

agregarImagenSugerida(): void {
  if (this.imagenSugerida && !this.producto.imagenes.includes(this.imagenSugerida)) {
    this.producto.imagenes.push(this.imagenSugerida);
  }
}

mostrarModal(mensaje: string): void {
  this.mensajeModal = mensaje;
  const modalEl = document.getElementById('modalExito');
  const modal = new (window as any).bootstrap.Modal(modalEl);
  modal.show();

  // Cierre automático con fade después de 2 segundos
  setTimeout(() => {
    modal.hide();
  }, 1000);

  // Limpieza del overlay/backdrop
  modalEl?.addEventListener('hidden.bs.modal', () => {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
  });
}
volver(): void {
  const esEdicion = this.route.snapshot.paramMap.get('id');
  this.router.navigate([esEdicion ? '/productos' : '/productos']);
}

//API DESCRIPCION
generarReceta(nombreOriginal: string): void {
  const nombreTraducido = this.traducirNombre(nombreOriginal);

  this.openFoodService.buscarReceta(nombreTraducido).subscribe(res => {
    let receta = res.meals ? res.meals[0] : null;

    if (!receta) {
      // Si no hay coincidencia, buscamos una receta aleatoria
      fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(r => r.json())
        .then(data => {
          receta = data.meals?.[0] || null;
          this.asignarReceta(receta);
        });
    } else {
      this.asignarReceta(receta);
    }
  });
}
asignarReceta(receta: any): void {
  this.recetaSugerida = receta;
  this.ingredientesSugeridos = [];

  for (let i = 1; i <= 20; i++) {
    const ing = receta['strIngredient' + i];
    const med = receta['strMeasure' + i];
    if (ing && ing.trim()) {
      this.ingredientesSugeridos.push(`${ing.trim()} ${med ? '- ' + med.trim() : ''}`);
    }
  }
}

traducirNombre(nombre: string): string {
  const traducciones: Record<string, string> = {
  'cassoulet': 'cazuela',
  'wontons': 'empanadillas chinas',
  'agridulce': 'sweet and sour',
  'sopa': 'soup',
  'Potato Salad':'sandwich de milanesa',
  'sándwich': 'sandwich',
  'picante': 'spicy',
  'chuleta': 'pork chop',
  'manzana': 'apple',
  'batata': 'sweet potato',
  'zucchini': 'zucchini',
  'barbacoa': 'bbq',
  'bigos': 'guiso de cazadores',
  'katsudon': 'katsudon japonés',
  'febras': 'barbecued pork',
  'asadas': 'grilled',
  'asado': 'roast',
  'goulash': 'goulash',
  'of': 'de',
  'and': 'y',
  'with': 'con',
  'in': 'en',
};

  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => traducciones[palabra] || palabra)
    .join(' ');
}



usarRecetaComoDescripcion(): void {
  // Validación previa
  if (!this.recetaSugerida?.strMeal || !this.ingredientesSugeridos.length) return;

  // Resetea la descripción por si el botón se presionó varias veces
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
}

limpiarDescripcion(): void {
  this.producto.descripcion = '';
}


}
