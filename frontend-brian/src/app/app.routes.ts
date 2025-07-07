import { Routes } from '@angular/router';
import { ComboFormComponent } from './components/combo-form/combo-form.component';
import { OfertaFormComponent } from './components/oferta-form/oferta-form.component';
import { ComboListComponent } from './components/combo-list/combo-list.component';
import { OfertaListComponent } from './components/oferta-list/oferta-list.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'combos', component: ComboListComponent },
  { path: 'ofertas', component: OfertaListComponent },
  { path: 'editar-combo/:id', component: ComboFormComponent },
  { path: 'editar-oferta/:id', component: OfertaFormComponent },
  { path: 'crear-combo', component: ComboFormComponent },
  { path: 'crear-oferta', component: OfertaFormComponent }
];
