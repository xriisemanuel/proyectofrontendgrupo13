// src/app/features/admin/manage-combos/manage-combos.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importa Router
import { ComboService } from '../../../data/services/combo'; // Asegúrate de que la ruta sea correcta
import { ICombo } from '../../../shared/interfaces';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../../../shared/confirm-dialog'; // Asegúrate de que la ruta sea correcta

// Importaciones de Angular Material Dialog
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ComboDetailModalComponent } from '../combo-detail-modal/combo-detail-modal'; // Importa el nuevo componente modal

@Component({
  selector: 'app-manage-combos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule // Importa MatDialogModule aquí
  ],
  templateUrl: './manage-combos.html',
  styleUrls: ['./manage-combos.css']
})
export class ManageCombosComponent implements OnInit {
  combos: ICombo[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private comboService: ComboService,
    private toastr: ToastrService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router, // Inyecta Router
    public dialog: MatDialog // Inyecta MatDialog
  ) { }

  ngOnInit(): void {
    this.loadCombos();
  }

  /**
   * Carga la lista de todos los combos.
   */
  loadCombos(): void {
    this.loading = true;
    this.errorMessage = null;
    this.comboService.getCombos().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los combos: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        return of([]);
      }),
      finalize(() => this.loading = false)
    ).subscribe(combos => {
      this.combos = combos;
    });
  }

  /**
   * Abre un diálogo para ver los detalles de un combo.
   * @param comboId El ID del combo a visualizar.
   */
  viewComboDetails(comboId: string): void {
    const dialogRef = this.dialog.open(ComboDetailModalComponent, {
      width: '650px', // Ancho del modal
      data: { comboId: comboId }, // Pasa el ID del combo al modal
      panelClass: 'custom-dialog-container' // Clase CSS para estilizar el contenedor del diálogo
    });

    dialogRef.afterClosed().subscribe(result => {
      // 'result' será 'modified', 'deleted' o 'closed' según la acción en el modal
      if (result === 'modified') {
        this.toastr.info('Navegando a la edición del combo...', 'Acción');
        this.router.navigate(['/admin/combos/edit', comboId]); // Asumo esta ruta para edición
      } else if (result === 'deleted') {
        // Si se solicitó eliminar desde el modal, confirmamos y eliminamos
        const comboToDelete = this.combos.find(c => c._id === comboId);
        if (comboToDelete) {
          this.deleteCombo(comboToDelete._id!, comboToDelete.nombre);
        }
      }
      // Si result es 'closed', no hacemos nada
    });
  }


  /**
   * Elimina un combo después de la confirmación.
   * @param comboId El ID del combo a eliminar.
   * @param comboNombre El nombre del combo para el mensaje de confirmación.
   */
  deleteCombo(comboId: string, comboNombre: string): void {
    this.confirmDialogService.confirm(`¿Estás seguro de que quieres eliminar el combo "${comboNombre}"? Esta acción es irreversible.`)
      .then((confirmed) => {
        if (confirmed) {
          this.loading = true;
          this.comboService.deleteCombo(comboId).pipe(
            catchError(error => {
              this.errorMessage = error.message || 'Error al eliminar el combo.';
              this.toastr.error(this.errorMessage ?? 'Error al eliminar el combo.', 'Error de Eliminación');
              return of(null);
            }),
            finalize(() => this.loading = false)
          ).subscribe(response => {
            if (response) {
              this.toastr.success('Combo eliminado exitosamente.', 'Eliminación Exitosa');
              this.loadCombos(); // Recargar la lista de combos
            }
          });
        }
      });
  }

  /**
   * Cambia el estado (activo/inactivo) de un combo.
   * @param combo El combo a actualizar.
   */
  toggleComboStatus(combo: ICombo): void {
    if (!combo._id) {
      this.toastr.error('El ID del combo no está definido.', 'Error');
      return;
    }

    this.loading = true;
    const action = combo.activo ? 'desactivar' : 'activar';
    const serviceCall = combo.activo ? this.comboService.deactivateCombo(combo._id!) : this.comboService.activateCombo(combo._id!);

    serviceCall.pipe(
      catchError(error => {
        this.errorMessage = `Error al ${action} el combo: ` + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, `Error al ${action} Combo`);
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.toastr.success(`Combo ${combo.activo ? 'desactivado' : 'activado'} exitosamente.`, 'Estado Actualizado');
        // Actualizar el estado en el objeto local para reflejar el cambio sin recargar todo
        combo.activo = !combo.activo;
      }
    });
  }

  // Método de edición original, ahora se llamará desde el modal si es necesario
  editCombo(comboId: string): void {
    this.router.navigate(['/admin/combos/edit', comboId]); // Navega a la ruta de edición
  }
}