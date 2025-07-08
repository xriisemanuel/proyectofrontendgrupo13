// src/app/features/admin/combo-detail-modal/combo-detail-modal.component.ts

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog'; // Importaciones de Angular Material Dialog
import { ComboService } from '../../../data/services/combo'; // Asegúrate de que la ruta sea correcta
import { ICombo, IProducto } from '../../../shared/interfaces'; // Asegúrate de que la ruta sea correcta
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// Importa MatButtonModule si vas a usar botones de Material Design
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-combo-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe, // Para formatear el precio
    TitleCasePipe, // Para formatear el estado
    MatButtonModule, // Módulo de botones de Material
    MatIconModule // Módulo de iconos de Material
    ,
    MatDialogContent,
    MatDialogActions
],
  templateUrl: './combo-detail-modal.html',
  styleUrls: ['./combo-detail-modal.css']
})
export class ComboDetailModalComponent implements OnInit {
  combo: ICombo | null = null;
  productosEnCombo: IProducto[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { comboId: string }, // Inyecta los datos pasados al diálogo
    public dialogRef: MatDialogRef<ComboDetailModalComponent>, // Referencia al diálogo para cerrarlo
    private comboService: ComboService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadComboDetails(this.data.comboId);
  }

  /**
   * Carga los detalles del combo, incluyendo sus productos.
   * @param comboId El ID del combo a cargar.
   */
  loadComboDetails(comboId: string): void {
    this.loading = true;
    this.errorMessage = null;
    this.comboService.getComboById(comboId).pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los detalles del combo: ' + (error.message || 'Error desconocido');
        this.toastr.error(this.errorMessage, 'Error de Carga');
        this.dialogRef.close(); // Cierra el diálogo si hay un error crítico
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe(response => {
      if (response) {
        this.combo = response.combo;
        this.productosEnCombo = response.productos; // Asumo que el backend devuelve 'productos' populados
      }
    });
  }

  /**
   * Cierra el diálogo y notifica al componente padre si se realizó una acción.
   * @param action La acción realizada (ej. 'modified', 'deleted', 'closed').
   */
  closeDialog(action: 'modified' | 'deleted' | 'closed'): void {
    this.dialogRef.close(action);
  }

  /**
   * Maneja la acción de modificar el combo.
   * Emite un evento o cierra el diálogo con un indicador de modificación.
   */
  onModify(): void {
    // Aquí podrías redirigir a una ruta de edición o emitir un evento
    // Por ahora, simplemente cierra el diálogo indicando que se intentó modificar
    this.closeDialog('modified');
  }

  /**
   * Maneja la acción de eliminar el combo.
   * Emite un evento o cierra el diálogo con un indicador de eliminación.
   * La lógica real de eliminación se manejará en ManageCombosComponent.
   */
  onDelete(): void {
    // Aquí no eliminamos directamente, sino que cerramos el diálogo
    // y le decimos al componente padre que se ha solicitado la eliminación.
    this.closeDialog('deleted');
  }
}