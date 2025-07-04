import { Component, OnInit } from '@angular/core';
import { OfertaService, Oferta } from '../../services/oferta.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oferta-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oferta-list.component.html',
  styleUrl: './oferta-list.component.css'
})
export class OfertaListComponent implements OnInit {
  ofertas: Oferta[] = [];

  constructor(private ofertaService: OfertaService) {}

  ngOnInit() {
    this.ofertaService.getOfertas().subscribe({
      next: (data) => this.ofertas = data,
      error: () => this.ofertas = []
    });
  }
}
