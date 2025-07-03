import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos/productos.component';
import { CategoriasComponent } from './components/categorias/categorias.component';
import { FormularioCategoriaComponent } from './components/form-categorias/form-categorias.component';
import { FormProductoComponent } from './components/form-productos/form-productos.component';

export const routes: Routes = [
    { path: '', redirectTo: 'categorias', pathMatch: 'full' },

    // { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'productos', component: ProductosComponent },
  { path: 'categorias', component: CategoriasComponent },
  { path: 'categorias/formulario', component: FormularioCategoriaComponent },
{ path: 'categorias/editar/:id', component: FormularioCategoriaComponent },
{path: 'productos/formulario',component: FormProductoComponent},
{ path: 'productos/editar/:id', component: FormProductoComponent }


];