// src/app/components/calificaciones/calificaciones.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { CalificacionesService, Calificacion } from '../../services/calificaciones.service';
import { Subscription } from 'rxjs';

// La declaración 'declare const initializeStarRating' ya no es necesaria aquí si está en global.d.ts
// Si la tenías, puedes eliminarla de este archivo.

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss']
})
export class CalificacionesComponent implements OnInit, AfterViewInit, OnDestroy {
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
  private subscriptions: Subscription[] = [];

  constructor() {
    this.form = this.fb.group({
      pedidoId: this.fb.control<string | null>('', Validators.required),
      clienteId: this.fb.control<string | null>('', Validators.required),
      puntuacionComida: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
      puntuacionServicio: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(5)]),
      puntuacionEntrega: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(5)]),
      comentario: this.fb.control<string | null>('')
    });
  }

  ngOnInit(): void {
    this.loadCalificaciones();
  }

  ngAfterViewInit(): void {
    // Asegúrate de que initializeStarRating esté disponible globalmente
    // El typeof check es una buena práctica defensiva
    if (typeof initializeStarRating === 'function') {
      this.initializeFormStarRatings();
      this.initializeTableStarRatings();
    } else {
      console.error('initializeStarRating function is not defined. Make sure star-rating-pure-js.js is loaded in index.html.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // No se necesitan listeners explícitos de remoción si initializeStarRating no los adjunta al componente
  }

  private initializeFormStarRatings(): void {
    const formRatingContainers = [
      { id: 'puntuacionComidaForm', control: this.form.get('puntuacionComida'), initial: this.form.value.puntuacionComida || 0 },
      { id: 'puntuacionServicioForm', control: this.form.get('puntuacionServicio'), initial: this.form.value.puntuacionServicio || 0 },
      { id: 'puntuacionEntregaForm', control: this.form.get('puntuacionEntrega'), initial: this.form.value.puntuacionEntrega || 0 }
    ];

    formRatingContainers.forEach(item => {
      const container = document.getElementById(item.id);
      if (container) {
        initializeStarRating(item.id, item.initial!, false, `ratingChange_${item.id}`);
        const listener = (event: Event) => {
          const customEvent = event as CustomEvent;
          item.control?.setValue(customEvent.detail.rating);
          item.control?.markAsDirty();
          item.control?.markAsTouched();
        };
        container.addEventListener(`ratingChange_${item.id}`, listener);
        this.subscriptions.push(new Subscription(() => container.removeEventListener(`ratingChange_${item.id}`, listener)));
      }
    });
  }

  private initializeTableStarRatings(): void {
    this.calificaciones.forEach((cal) => {
      if (cal.puntuacionComida !== null && cal.puntuacionComida !== undefined) {
        initializeStarRating(`puntuacionComidaTable_${cal._id}`, cal.puntuacionComida, true);
      }
      if (cal.puntuacionServicio !== null && cal.puntuacionServicio !== undefined) {
        initializeStarRating(`puntuacionServicioTable_${cal._id}`, cal.puntuacionServicio, true);
      }
      if (cal.puntuacionEntrega !== null && cal.puntuacionEntrega !== undefined) {
        initializeStarRating(`puntuacionEntregaTable_${cal._id}`, cal.puntuacionEntrega, true);
      }
    });
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
        // Re-inicializar las estrellas de la tabla después de cargar los datos
        if (typeof initializeStarRating === 'function') {
          setTimeout(() => this.initializeTableStarRatings(), 0);
        }
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
          puntuacionComida: null,
          puntuacionServicio: null,
          puntuacionEntrega: null,
          comentario: ''
        });
        // Re-inicializar las estrellas del formulario después de resetear
        if (typeof initializeStarRating === 'function') {
          setTimeout(() => this.initializeFormStarRatings(), 0);
        }
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
