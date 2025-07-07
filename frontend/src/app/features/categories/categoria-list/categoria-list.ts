// src/app/features/categories/components/categoria-list/categoria-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CategoriaService } from '../../categories/categoria';
import { ICategoria } from '../../categories/models/categoria.model';
import { AuthService } from '../../../core/auth/auth';
import { ToastrService } from 'ngx-toastr'; // ¡Mantenemos ToastrService!


@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categoria-list.html',
  styleUrls: ['./categoria-list.css']
})
export class CategoriaListComponent implements OnInit {
  categorias: ICategoria[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(estado?: boolean): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoriaService.getCategorias(estado).subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
        console.log('Categorías cargadas:', this.categorias);
      },
      error: (err) => {
        const msg = err.error?.mensaje || 'Error desconocido al cargar las categorías.';
        this.errorMessage = msg;
        this.isLoading = false;
        this.toastr.error(msg, 'Error de Carga');
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  // >>>>>>>>>>>>>> NUEVO MÉTODO PARA MANEJAR EL CAMBIO DEL FILTRO <<<<<<<<<<<<<<<
  onEstadoFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    let estado: boolean | undefined;

    if (target.value === 'true') {
      estado = true;
    } else if (target.value === 'false') {
      estado = false;
    } else {
      estado = undefined; // Para la opción 'Todas'
    }
    this.loadCategorias(estado);
  }
  // >>>>>>>>>>>>>> FIN DEL NUEVO MÉTODO <<<<<<<<<<<<<<<

  deleteCategoria(id: string, nombre: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`)) {
      this.categoriaService.deleteCategoria(id).subscribe({
        next: (res) => {
          this.toastr.success(res.mensaje || 'La categoría ha sido eliminada.', 'Eliminación Exitosa');
          this.loadCategorias();
        },
        error: (err) => {
          const msg = err.error?.mensaje || 'No se pudo eliminar la categoría.';
          this.toastr.error(msg, 'Error al Eliminar');
          console.error('Error al eliminar categoría:', err);
        }
      });
    } else {
      this.toastr.info('Eliminación de categoría cancelada.', 'Cancelado');
    }
  }

  activarCategoria(id: string, nombre: string): void {
    if (confirm(`¿Quieres activar la categoría "${nombre}" para que sea visible?`)) {
      this.categoriaService.activarCategoria(id).subscribe({
        next: (res) => {
          this.toastr.success(res.mensaje || 'La categoría ha sido activada.', 'Activación Exitosa');
          this.loadCategorias();
        },
        error: (err) => {
          const msg = err.error?.mensaje || 'No se pudo activar la categoría.';
          this.toastr.error(msg, 'Error al Activar');
          console.error('Error al activar categoría:', err);
        }
      });
    } else {
      this.toastr.info('Activación de categoría cancelada.', 'Cancelado');
    }
  }

  desactivarCategoria(id: string, nombre: string): void {
    if (confirm(`¿Quieres desactivar la categoría "${nombre}"? No será visible para los clientes.`)) {
      this.categoriaService.desactivarCategoria(id).subscribe({
        next: (res) => {
          this.toastr.success(res.mensaje || 'La categoría ha sido desactivada.', 'Desactivación Exitosa');
          this.loadCategorias();
        },
        error: (err) => {
          const msg = err.error?.mensaje || 'No se pudo desactivar la categoría.';
          this.toastr.error(msg, 'Error al Desactivar');
          console.error('Error al desactivar categoría:', err);
        }
      });
    } else {
      this.toastr.info('Desactivación de categoría cancelada.', 'Cancelado');
    }
  }

  editCategoria(id: string): void {
    this.router.navigate(['/admin/categorias/edit', id]);
  }

  createCategoria(): void {
    this.router.navigate(['/admin/categorias/new']);
  }
}