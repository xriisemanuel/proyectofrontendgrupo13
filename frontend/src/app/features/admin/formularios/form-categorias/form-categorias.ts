import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../../data/services/categoria';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2'; // Importa SweetAlert2

@Component({
  selector: 'app-form-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-categorias.html',
  styleUrl: './form-categorias.css'
})
export class FormularioCategoriaComponent implements OnInit {
  categoria: any = {
    nombre: '',
    descripcion: '',
    imagen: '',
    estado: true
  };
  modoEdicion = false;
  categoriaId = '';

  // mensajeModal ya no es necesario, se elimina

  constructor(
    private categoriaService: Categoria,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoriaId = this.route.snapshot.paramMap.get('id') || '';
    this.modoEdicion = !!this.categoriaId;

    if (this.modoEdicion) {
      this.categoriaService.getCategoriaPorId(this.categoriaId).subscribe(data => {
        this.categoria = data;
      });
    }
  }

  guardar(): void {
    if (!this.categoria.nombre || !this.categoria.descripcion || !this.categoria.imagen) {
        Swal.fire('Error', 'Por favor, complete todos los campos obligatorios.', 'error');
        return;
    }

    if (this.modoEdicion) {
      this.categoriaService.actualizarCategoria(this.categoriaId, this.categoria).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Categoría actualizada correctamente', 'success');
          setTimeout(() => this.router.navigate(['/admin/categorias/manage']), 1500);
        },
        error: (err) => {
          console.error('Error al actualizar categoría:', err);
          Swal.fire('Error', err.error?.mensaje || 'Error al actualizar la categoría.', 'error');
        }
      });
    } else {
      this.categoriaService.crearCategoria(this.categoria).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Categoría creada correctamente', 'success');
          setTimeout(() => this.router.navigate(['/admin/categorias/manage']), 1500);
        },
        error: (err) => {
          console.error('Error al crear categoría:', err);
          Swal.fire('Error', err.error?.mensaje || 'Error al crear la categoría.', 'error');
        }
      });
    }
  }

  // El método mostrarModal ya no es necesario y se elimina
  // mensajeModal ya no es necesario

  volver(): void {
    this.router.navigate(['/admin/categorias/manage']);
  }
}
