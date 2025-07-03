import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service'; // Asegúrate de que la ruta sea correcta
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
 

  constructor(private productoService: ProductoService,
  private router: Router) {}

 ngOnInit(): void {
  this.productoService.getProductos().subscribe((data) => {
    this.productos = data;
    this.productosFiltrados = [];
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
  this.router.navigate(['/productos/formulario']);
}

mensajeModal = '';

editarProducto(producto: any): void {
  // Si usás Router, podés navegar al formulario con ID
  this.router.navigate(['/productos/editar', producto._id]);
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
