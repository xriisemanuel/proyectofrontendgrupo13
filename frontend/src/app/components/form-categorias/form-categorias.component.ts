import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-categorias.component.html',
  styleUrl: './form-categorias.component.css'
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

  constructor(
    private categoriaService: CategoriaService,
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
  if (!this.categoria.nombre || !this.categoria.descripcion || !this.categoria.imagen) return;

  if (this.modoEdicion) {
    this.categoriaService.actualizarCategoria(this.categoriaId, this.categoria).subscribe(() => {
      this.mostrarModal('Categoría actualizada correctamente');
      // Si querés redirigir después de unos segundos:
      // setTimeout(() => this.router.navigate(['/categorias']), 2000);
    });
  } else {
    this.categoriaService.crearCategoria(this.categoria).subscribe(() => {
      this.mostrarModal('Categoría creada correctamente');
      // Si querés redirigir después de unos segundos:
      // setTimeout(() => this.router.navigate(['/categorias']), 2000);
    });
  }
}

mensajeModal = '';

mostrarModal(mensaje: string): void {
  this.mensajeModal = mensaje;

  const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
  modal.show();

  // ⏱️ Esperamos 2 segundos y redirigimos
  setTimeout(() => {
    modal.hide(); // Cerramos el modal manualmente
    this.router.navigate(['/categorias']); // Navegamos a la vista principal
  }, 2000);
}
volver(): void {
  const esEdicion = this.route.snapshot.paramMap.get('id');
  this.router.navigate([esEdicion ? '/categorias' : '/categorias']);
}
}