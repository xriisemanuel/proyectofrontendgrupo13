// src/app/features/admin/oferta-detail-modal/oferta-detail-modal.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importa DatePipe
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { OfertaService } from '../../../data/services/oferta';
import { IOfertaPopulated } from '../../../shared/oferta.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';

@Component({
  selector: 'app-oferta-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './oferta-detail-modal.html',
  styleUrls: ['./oferta-detail-modal.css'],
  providers: [DatePipe] // Provee DatePipe
})
export class OfertaDetailModalComponent implements OnInit {
  oferta: IOfertaPopulated | null = null;
  loading = true;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<OfertaDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ofertaId: string },
    private ofertaService: OfertaService,
    private toastr: ToastrService,
    private confirmDialogService: ConfirmDialogService,
    private datePipe: DatePipe // Inyecta DatePipe
  ) { }

  ngOnInit(): void {
    if (this.data.ofertaId) {
      this.loadOfertaDetails(this.data.ofertaId);
    } else {
      this.errorMessage = 'ID de oferta no proporcionado.';
      this.loading = false;
    }
  }

  loadOfertaDetails(id: string): void {
    this.loading = true;
    this.ofertaService.getOfertaById(id).pipe(
      catchError(error => {
        this.errorMessage = error.message || 'Error al cargar los detalles de la oferta.';
        this.toastr.error(this.errorMessage ?? 'Error al cargar los detalles de la oferta.', 'Error de Carga');
        this.dialogRef.close('closed'); // Cerrar el modal en caso de error
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(oferta => {
      if (oferta) {
        this.oferta = oferta;
      }
    });
  }

  /**
   * Cierra el modal y notifica al componente padre si se debe editar.
   */
  onEdit(): void {
    this.dialogRef.close('modified');
  }

  /**
   * Cierra el modal y notifica al componente padre si se debe eliminar.
   */
  onDelete(): void {
    if (!this.oferta?._id || !this.oferta?.nombre) {
      this.toastr.error('Datos de oferta incompletos para eliminar.', 'Error');
      return;
    }

    this.confirmDialogService.confirm(`¿Estás seguro de que quieres eliminar la oferta "${this.oferta.nombre}"? Esta acción es irreversible.`)
      .then((confirmed) => {
        if (confirmed) {
          this.dialogRef.close('deleted'); // Notifica al componente padre para que maneje la eliminación
        }
      });
  }

  /**
   * Cierra el modal sin realizar ninguna acción específica.
   */
  onClose(): void {
    this.dialogRef.close('closed');
  }

  /**
   * Verifica si la oferta está vigente.
   */
  isOfertaVigente(oferta: IOfertaPopulated): boolean {
    const now = new Date();
    const fechaInicio = new Date(oferta.fechaInicio);
    const fechaFin = new Date(oferta.fechaFin);
    return oferta.estado && (fechaInicio <= now) && (fechaFin >= now);
  }

  /**
   * Formatea una fecha para mostrar.
   */
  formatDateForDisplay(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return this.datePipe.transform(date, 'mediumDate') || 'N/A';
  }
}