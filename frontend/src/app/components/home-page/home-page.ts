import { Component, OnInit } from '@angular/core'; // Importa OnInit
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html', // Enlaza al archivo HTML
  styleUrls: ['./home-page.css'], // Enlaza al archivo CSS
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class HomePage implements OnInit {
  ngOnInit(): void {
    // Lógica de inicialización si es necesaria
  }
}