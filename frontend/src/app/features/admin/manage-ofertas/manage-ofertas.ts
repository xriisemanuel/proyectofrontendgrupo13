// src/app/features/admin/manage-ofertas/manage-ofertas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OfertaService } from '../../../data/services/oferta';
import { IOferta, IOfertaPopulated } from '../../../shared/oferta.interface';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OfertaDetailModalComponent } from '../oferta-detail-modal/oferta-detail-modal';

@Component({
  selector: 'app-manage-ofertas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule
  ],
  templateUrl: './manage-ofertas.html',
  styleUrls: ['./manage-ofertas.css'],
  providers: [DatePipe]
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
    public dialog: MatDialog,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.loadOfertas();
  }

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

  viewOfertaDetails(ofertaId: string): void {
    const dialogRef = this.dialog.open(OfertaDetailModalComponent, {
      width: '750px',
      data: { ofertaId: ofertaId },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'modified') {
        this.toastr.info('Navegando a la edición de la oferta...', 'Acción');
        this.router.navigate(['/admin/ofertas/edit', ofertaId]);
      } else if (result === 'deleted') {
        const ofertaToDelete = this.ofertas.find(o => o._id === ofertaId);
        if (ofertaToDelete) {
          this.deleteOferta(ofertaToDelete._id!, ofertaToDelete.nombre);
        }
      }
    });
  }

  deleteOferta(ofertaId: string, ofertaNombre: string): void {
    this.confirmDialogService.confirmDelete(ofertaNombre, 'oferta').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.ofertaService.deleteOferta(ofertaId).pipe(
          catchError(error => {
            this.errorMessage = error.message || 'Error al eliminar la oferta.';
            this.toastr.error(this.errorMessage || 'Error al eliminar la oferta.', 'Error de Eliminación');
            return of(null);
          }),
          finalize(() => this.loading = false)
        ).subscribe(response => {
          if (response) {
            this.toastr.success('Oferta eliminada exitosamente.', 'Eliminación Exitosa');
            this.loadOfertas();
          }
        });
      }
    });
  }

  toggleOfertaStatus(oferta: IOferta): void {
    if (!oferta._id) {
      this.toastr.error('El ID de la oferta no está definido.', 'Error');
      return;
    }

    this.loading = true;
    const action = oferta.activa ? 'desactivar' : 'activar';
    const serviceCall = oferta.activa ? this.ofertaService.deactivateOferta(oferta._id!) : this.ofertaService.activateOferta(oferta._id!);

    serviceCall.pipe(
      catchError(error => {
        this.errorMessage = `Error al ${action} la oferta: ` + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, `Error al ${action} Oferta`);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success(`Oferta ${oferta.activa ? 'desactivada' : 'activada'} exitosamente.`, 'Estado Actualizado');
        oferta.activa = !oferta.activa;
      }
    });
  }

  editOferta(ofertaId: string): void {
    this.router.navigate(['/admin/ofertas/edit', ofertaId]);
  }

  isOfertaVigente(oferta: IOferta): boolean {
    const now = new Date();
    const fechaInicio = new Date(oferta.fechaInicio);
    const fechaFin = new Date(oferta.fechaFin);
    return oferta.activa && (fechaInicio <= now) && (fechaFin >= now);
  }

  formatDateForDisplay(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return this.datePipe.transform(date, 'mediumDate') || 'N/A';
  }

  getTipoOfertaText(tipoOferta: string): string {
    return tipoOferta === 'producto' ? 'Producto' : 'Categoría';
  }

  getTipoOfertaIcon(tipoOferta: string): string {
    return tipoOferta === 'producto' ? '🍕' : '📂';
  }

  getAplicablesText(oferta: IOfertaPopulated): string {
    if (oferta.tipoOferta === 'producto' && oferta.productosAplicables) {
      return `${oferta.productosAplicables.length} producto(s)`;
    } else if (oferta.tipoOferta === 'categoria' && oferta.categoriasAplicables) {
      return `${oferta.categoriasAplicables.length} categoría(s)`;
    }
    return 'N/A';
  }
}