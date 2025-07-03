import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../services/categoria.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
   busqueda = '';
  categorias: any[] = [];
  categoriasFiltradas: any[] = [];

  constructor(
    private categoriaService: CategoriaService,
    private router: Router
  ) {}


ngOnInit(): void {
  this.categoriaService.getCategorias().subscribe(data => {
    this.categorias = data;
    this.categoriasFiltradas = [];
  });
}

filtrarCategorias(): void {
  const texto = this.busqueda.trim().toLowerCase();

  if (!texto) {
    this.categoriasFiltradas = [];
    return;
  }

  this.categoriasFiltradas = this.categorias.filter(c =>
    c.nombre?.toLowerCase().includes(texto) ||
    c.descripcion?.toLowerCase().includes(texto)
  );
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
  mensajeModal = '';

mostrarModal(mensaje: string): void {
  this.mensajeModal = mensaje;
  const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
  modal.show();
}

}
