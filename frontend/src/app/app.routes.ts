import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos/productos.component';
import { CategoriasComponent } from './components/categorias/categorias.component';
import { FormularioCategoriaComponent } from './components/form-categorias/form-categorias.component';
import { FormProductoComponent } from './components/form-productos/form-productos.component';
import { CategoriaPublicComponent } from './components/categoria-public/categoria-public.component';
import { ProductosPublicComponent } from './components/productos-public/productos-public.component';

export const routes: Routes = [
  { path: '', redirectTo: 'categorias', pathMatch: 'full' },

  // { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'productos', component: ProductosComponent },//ADMIN
  { path: 'categorias', component: CategoriasComponent },//ADMIN
  { path: 'categorias/formulario', component: FormularioCategoriaComponent },
  { path: 'categorias/editar/:id', component: FormularioCategoriaComponent },
  { path: 'productos/formulario', component: FormProductoComponent },
  { path: 'productos/editar/:id', component: FormProductoComponent },
  {path: 'categorias-public', component: CategoriaPublicComponent},//cliente
  {path: 'productos-public', component: ProductosPublicComponent},//cliente
];