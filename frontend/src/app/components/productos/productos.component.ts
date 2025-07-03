import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  busqueda = '';
  productos: any[] = [];
  productosFiltrados: any[] = [];
  mensajeModal = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

 ngOnInit(): void {
  this.productoService.getProductos().subscribe(data => {
    this.categoriaService.getCategorias().subscribe(categorias => {
      // 🔍 Aseguramos coincidencia correcta entre ObjectId y string
      this.productos = data.map(prod => {
        const categoria = categorias.find(c =>
          String(c._id) === String(prod.categoriaId)
        );
        return {
          ...prod,
          categoriaNombre: categoria?.nombre || 'Sin categoría'
        };
      });

      this.productosFiltrados = [];
    });
  });
}

  filtrarProductos(): void {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      this.productosFiltrados = [];
      return;
    }

    this.productosFiltrados = this.productos.filter(p =>
      p.nombre?.toLowerCase().includes(texto) ||
      p.descripcion?.toLowerCase().includes(texto) ||
      p.categoriaNombre?.toLowerCase().includes(texto)
    );
  }

  irAFormulario(): void {
    this.router.navigate(['productos/formulario']);
  }

  editarProducto(producto: any): void {
    this.router.navigate(['productos/editar', producto._id]);
  }

  eliminarProducto(id: string): void {
    if (confirm('¿Estás seguro que querés eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe(() => {
        this.productos = this.productos.filter(p => p._id !== id);
        this.productosFiltrados = this.productosFiltrados.filter(p => p._id !== id);
        this.mostrarModal('Producto eliminado correctamente');
      });
    }
  }

  mostrarModal(mensaje: string): void {
    this.mensajeModal = mensaje;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalExito'));
    modal.show();
  }
}
