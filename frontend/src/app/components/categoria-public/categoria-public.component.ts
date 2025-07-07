import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService } from '../../services/categoria.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-categoria-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categoria-public.component.html',
  styleUrls: ['./categoria-public.component.css']
})
export class CategoriaPublicComponent implements OnInit {

  categorias: any[] = [];
  productos: any[] = [];

  constructor(
    private categoriaService: CategoriaService,
    private productoService: ProductoService,
    private router: Router
  ) {}

 ngOnInit(): void {
  this.categoriaService.getCategorias().subscribe(data => {
    this.categorias = data.filter(cat => cat.estado); // 👈 solo activas
  });

  this.productoService.getProductos().subscribe(data => {
    this.productos = data
      .filter(p =>
        p.disponible &&
        p.imagenes?.length > 0 &&
        p.popularidad >= 6
      )
      .sort((a, b) => b.popularidad - a.popularidad);
  });
}

  verTodosLosProductos(): void {
    this.router.navigate(['/productos-public']);
  }

  verProductosPorCategoria(categoriaId: string): void {
    this.router.navigate(['/productos-public'], { queryParams: { categoriaId } });
  }
}
