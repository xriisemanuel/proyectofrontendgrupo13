import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { CalificacionesService, Calificacion } from '../../services/calificaciones.service';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbRatingModule],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss']
})
export class CalificacionesComponent {
  calificaciones: Calificacion[] = [];
  error: string = '';

  form: FormGroup<{
    pedidoId: FormControl<string | null>;
    clienteId: FormControl<string | null>;
    puntuacionComida: FormControl<number | null>;
    puntuacionServicio: FormControl<number | null>;
    puntuacionEntrega: FormControl<number | null>;
    comentario: FormControl<string | null>;
  }>;

  private calificacionesService = inject(CalificacionesService);
  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      pedidoId: this.fb.control<string | null>('', Validators.required),
      clienteId: this.fb.control<string | null>('', Validators.required),
      puntuacionComida: this.fb.control<number | null>(1, [Validators.required, Validators.min(1), Validators.max(5)]),
      puntuacionServicio: this.fb.control<number | null>(null),
      puntuacionEntrega: this.fb.control<number | null>(null),
      comentario: this.fb.control<string | null>('')
    });
    this.loadCalificaciones();
  }

  toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  loadCalificaciones() {
    this.calificacionesService.getCalificaciones().subscribe({
      next: (data) => {
        this.calificaciones = data.map(c => ({
          ...c,
          puntuacionComida: this.toNumberOrNull(c.puntuacionComida),
          puntuacionServicio: this.toNumberOrNull(c.puntuacionServicio),
          puntuacionEntrega: this.toNumberOrNull(c.puntuacionEntrega),
        }));
      },
      error: () => this.error = 'Error cargando calificaciones'
    });
  }

  onSubmit() {
    this.error = '';

    if (this.form.invalid) {
      this.error = 'Formulario inválido: revisá todos los campos.';
      return;
    }

    const safeData: Calificacion = {
      pedidoId: this.form.value.pedidoId!,
      clienteId: this.form.value.clienteId!,
      puntuacionComida: this.toNumberOrNull(this.form.value.puntuacionComida)!,
      puntuacionServicio: this.toNumberOrNull(this.form.value.puntuacionServicio),
      puntuacionEntrega: this.toNumberOrNull(this.form.value.puntuacionEntrega),
      comentario: this.form.value.comentario ?? ''
    };

    this.calificacionesService.createCalificacion(safeData).subscribe({
      next: () => {
        this.form.setValue({
          pedidoId: '',
          clienteId: '',
          puntuacionComida: 1,
          puntuacionServicio: null,
          puntuacionEntrega: null,
          comentario: ''
        });
        this.loadCalificaciones();
      },
      error: (err) => this.error = err.error?.mensaje || 'Error al crear calificación'
    });
  }

  eliminarCalificacion(id: string) {
    if (confirm('¿Estás seguro de eliminar esta calificación?')) {
      this.calificacionesService.deleteCalificacion(id).subscribe({
        next: () => this.loadCalificaciones(),
        error: () => this.error = 'Error al eliminar calificación'
      });
    }
  }
}
