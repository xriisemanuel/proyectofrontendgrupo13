// src/app/features/admin/manage-ofertas/manage-ofertas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importa DatePipe
import { RouterLink, Router } from '@angular/router';
import { OfertaService } from '../../../data/services/oferta';
import { IOferta, IOfertaPopulated } from '../../../shared/oferta.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog'; // Ajusta la ruta

// Importaciones de Angular Material Dialog
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Importa el nuevo componente modal de detalles (lo crearemos a continuación)
import { OfertaDetailModalComponent } from '../oferta-detail-modal/oferta-detail-modal'; // Asegúrate de que la ruta sea correcta


@Component({
  selector: 'app-manage-ofertas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule // Importa MatDialogModule aquí
  ],
  templateUrl: './manage-ofertas.html',
  styleUrls: ['./manage-ofertas.css'],
  providers: [DatePipe] // Provee DatePipe
})
export class ManageOfertasComponent implements OnInit {
  ofertas: IOfertaPopulated[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private ofertaService: OfertaService,
    private toastr: ToastrService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router,
    public dialog: MatDialog, // Inyecta MatDialog
    private datePipe: DatePipe // Inyecta DatePipe
  ) { }

  ngOnInit(): void {
    this.loadOfertas();
  }

  /**
   * Carga la lista de todas las ofertas.
   */
  loadOfertas(): void {
    this.loading = true;
    this.errorMessage = null;
    this.ofertaService.getOfertas().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar las ofertas: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe(ofertas => {
      this.ofertas = ofertas;
    });
  }

  /**
   * Abre un diálogo para ver los detalles de una oferta.
   * @param ofertaId El ID de la oferta a visualizar.
   */
  viewOfertaDetails(ofertaId: string): void {
    const dialogRef = this.dialog.open(OfertaDetailModalComponent, {
      width: '750px', // Ancho del modal
      data: { ofertaId: ofertaId }, // Pasa el ID de la oferta al modal
      panelClass: 'custom-dialog-container' // Clase CSS para estilizar el contenedor del diálogo
    });

    dialogRef.afterClosed().subscribe(result => {
      // 'result' puede ser 'modified', 'deleted' o 'closed' según la acción en el modal
      if (result === 'modified') {
        this.toastr.info('Navegando a la edición de la oferta...', 'Acción');
        this.router.navigate(['/admin/ofertas/edit', ofertaId]);
      } else if (result === 'deleted') {
        // Si se solicitó eliminar desde el modal, confirmamos y eliminamos
        const ofertaToDelete = this.ofertas.find(o => o._id === ofertaId);
        if (ofertaToDelete) {
          this.deleteOferta(ofertaToDelete._id!, ofertaToDelete.nombre);
        }
      }
    });
  }


  /**
   * Elimina una oferta después de la confirmación.
   * @param ofertaId El ID de la oferta a eliminar.
   * @param ofertaNombre El nombre de la oferta para el mensaje de confirmación.
   */
  deleteOferta(ofertaId: string, ofertaNombre: string): void {
    this.confirmDialogService.confirm(`¿Estás seguro de que quieres eliminar la oferta "${ofertaNombre}"? Esta acción es irreversible.`)
      .then((confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.ofertaService.deleteOferta(ofertaId).pipe(
            catchError(error => {
              this.errorMessage = error.message || 'Error al eliminar la oferta.';
              this.toastr.error(this.errorMessage ?? 'Error al eliminar la oferta.', 'Error de Eliminación');
              return of(null);
            }),
            finalize(() => this.loading = false)
          ).subscribe(response => {
            if (response) {
              this.toastr.success('Oferta eliminada exitosamente.', 'Eliminación Exitosa');
              this.loadOfertas(); // Recargar la lista de ofertas
            }
          });
        }
      });
  }

  /**
   * Cambia el estado (activo/inactivo) de una oferta.
   * @param oferta La oferta a actualizar.
   */
  toggleOfertaStatus(oferta: IOferta): void {
    if (!oferta._id) {
      this.toastr.error('El ID de la oferta no está definido.', 'Error');
      return;
    }

    this.loading = true;
    const action = oferta.estado ? 'desactivar' : 'activar';
    const serviceCall = oferta.estado ? this.ofertaService.deactivateOferta(oferta._id!) : this.ofertaService.activateOferta(oferta._id!);

    serviceCall.pipe(
      catchError(error => {
        this.errorMessage = `Error al ${action} la oferta: ` + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, `Error al ${action} Oferta`);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success(`Oferta ${oferta.estado ? 'desactivada' : 'activada'} exitosamente.`, 'Estado Actualizado');
        // Actualizar el estado en el objeto local para reflejar el cambio sin recargar todo
        oferta.estado = !oferta.estado;
      }
    });
  }

  /**
   * Navega a la pantalla de edición de una oferta.
   * @param ofertaId El ID de la oferta a editar.
   */
  editOferta(ofertaId: string): void {
    this.router.navigate(['/admin/ofertas/edit', ofertaId]);
  }

  /**
   * Verifica si la oferta está vigente.
   * @param oferta La oferta a verificar.
   * @returns true si la oferta está vigente, false en caso contrario.
   */
  isOfertaVigente(oferta: IOferta): boolean {
    const now = new Date();
    const fechaInicio = new Date(oferta.fechaInicio);
    const fechaFin = new Date(oferta.fechaFin);
    return oferta.estado && (fechaInicio <= now) && (fechaFin >= now);
  }

  /**
   * Formatea una fecha para mostrar.
   * @param date La fecha a formatear.
   * @returns La fecha formateada o 'N/A'.
   */
  formatDateForDisplay(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return this.datePipe.transform(date, 'mediumDate') || 'N/A';
  }
}