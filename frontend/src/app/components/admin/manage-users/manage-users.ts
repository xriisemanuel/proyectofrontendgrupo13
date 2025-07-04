import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router'; // Importa RouterLink para la navegación

@Component({
  selector: 'app-manage-users',
  imports: [RouterLink],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css'
})
export class ManageUsers implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // No hay lógica compleja de carga de datos para este componente,
    // ya que solo sirve como un menú de navegación visual.
  }
}
