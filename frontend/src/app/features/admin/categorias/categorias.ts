import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../data/services/categoria';
import { Router, RouterLink } from '@angular/router'; // Asegúrate de que RouterLink esté aquí
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Define la interfaz ICategoria si no está en un archivo compartido
interface ICategoria {
  _id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: boolean;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // RouterLink debe estar en imports
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class CategoriasComponent implements OnInit, OnDestroy {

  categorias: ICategoria[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private categoriaService: Categoria,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategorias(): void {
    this.categoriaService.getCategorias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: ICategoria[]) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        Swal.fire('Error', 'No se pudieron cargar las categorías.', 'error');
      }
    });
  }

  irAFormulario(): void {
    this.router.navigate(['/admin/categorias/create']);
  }

  editarCategoria(categoria: ICategoria): void {
    this.router.navigate(['/admin/categorias/edit', categoria._id]);
  }

  eliminarCategoria(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaService.eliminarCategoria(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            Swal.fire(
              '¡Eliminado!',
              'La categoría ha sido eliminada.',
              'success'
            );
            this.loadCategorias();
          },
          error: (err) => {
            console.error('Error al eliminar categoría:', err);
            Swal.fire(
              'Error',
              err.error?.mensaje || 'Hubo un error al eliminar la categoría.',
              'error'
            );
          }
        });
      }
    });
  }

  verTodosLosProductos(): void {
    this.router.navigate(['/admin/productos/manage']);
  }

  verProductosPorCategoria(categoriaId: string, categoriaNombre: string, estadoCategoria: boolean): void {
    if (estadoCategoria) {
      this.router.navigate(['/admin/productos/manage'], { queryParams: { categoriaId } });
    } else {
      Swal.fire({
        title: 'Categoría inactiva',
        html: `La categoría <strong>${categoriaNombre}</strong> está actualmente inactiva.`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  }
}
