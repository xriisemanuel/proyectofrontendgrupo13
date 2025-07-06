import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../services/categoria.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';


@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {

  categorias: any[] = [];
  categoriaInactivaNombre = '';
  mensajeModal = '';
  productos: any[] = [];

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.categoriaService.getCategorias().subscribe(data => {
    this.categorias = data;
  });
 this.productoService.getProductos().subscribe(data => {
  this.productos = data
  .filter(p =>
    p.disponible &&
    p.imagenes?.length > 0 &&
    p.popularidad >= 6
  )
  .sort((a, b) => b.popularidad - a.popularidad); // 👈 más populares primero
});

}
  // Navegar al formulario de categoría
  irAFormulario(): void {
    this.router.navigate(['/categorias/formulario']);
  }

  // Navegar al modo edición con la categoría seleccionada
  editarCategoria(categoria: any): void {
    this.router.navigate(['/categorias/editar', categoria._id]);
  }

  // Eliminar la categoría
 eliminarCategoria(id: string): void {
  if (confirm('¿Estás seguro que querés eliminar esta categoría?')) {
    this.categoriaService.eliminarCategoria(id).subscribe(() => {
      this.categorias = this.categorias.filter(c => c._id !== id);
      this.mostrarModal('Categoría eliminada correctamente');
    });
  }
}
verTodosLosProductos(): void {
  this.router.navigate(['/productos']);
}

  verProductosPorCategoria(categoriaId: string): void {
  this.router.navigate(['/productos'], { queryParams: { categoriaId } });
}

mostrarModal(mensaje: string): void {
  this.mensajeModal = mensaje;
  const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
  modal.show();
}

mostrarModalInactivo(nombre: string): void {
   console.log('Modal disparado para:', nombre);
  this.categoriaInactivaNombre = nombre;
  const modal = new (window as any).bootstrap.Modal(document.getElementById('modalInactivo'));
  modal.show();
}


}
