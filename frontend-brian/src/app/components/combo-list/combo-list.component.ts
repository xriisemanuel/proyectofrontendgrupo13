import { Component, OnInit } from '@angular/core';
import { ComboService, Combo } from '../../services/combo.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-combo-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit {
  combos: Combo[] = [];

  constructor(private comboService: ComboService) {}

  ngOnInit() {
    this.comboService.getCombos().subscribe({
      next: (data) => this.combos = data,
      error: () => this.combos = []
    });
  }
}
