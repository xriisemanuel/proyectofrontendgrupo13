import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ComboFormComponent } from './components/combo-form/combo-form.component';
import { ComboListComponent } from './components/combo-list/combo-list.component';
import { OfertaFormComponent } from './components/oferta-form/oferta-form.component';
import { OfertaListComponent } from './components/oferta-list/oferta-list.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ReactiveFormsModule,
    ComboFormComponent,
    ComboListComponent,
    OfertaFormComponent,
    OfertaListComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend-brian';
  
  constructor(public authService: AuthService) {
    console.log('AppComponent inicializado');
  }
  
  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
