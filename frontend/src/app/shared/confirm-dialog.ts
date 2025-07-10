// src/app/shared/confirm-dialog/confirm-dialog.service.ts

import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog/confirm-dialog.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {

  constructor(private dialog: MatDialog) { }

  /**
   * Muestra un diálogo de confirmación moderno y profesional.
   *
   * @param data Los datos del diálogo de confirmación
   * @returns Un Observable que emite true si el usuario confirma, false si cancela
   */
  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: data,
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,
      panelClass: 'modern-dialog'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Método de conveniencia para confirmaciones de eliminación.
   *
   * @param itemName El nombre del elemento a eliminar
   * @param itemType El tipo de elemento (opcional)
   * @returns Un Observable que emite true si el usuario confirma, false si cancela
   */
  confirmDelete(itemName: string, itemType: string = 'elemento'): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar "${itemName}"? Esta acción es irreversible y no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_forever'
    });
  }

  /**
   * Método de conveniencia para confirmaciones de advertencia.
   *
   * @param title El título del diálogo
   * @param message El mensaje del diálogo
   * @returns Un Observable que emite true si el usuario confirma, false si cancela
   */
  confirmWarning(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title: title,
      message: message,
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      type: 'warning',
      icon: 'warning'
    });
  }

  /**
   * Método de conveniencia para confirmaciones informativas.
   *
   * @param title El título del diálogo
   * @param message El mensaje del diálogo
   * @returns Un Observable que emite true si el usuario confirma, false si cancela
   */
  confirmInfo(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title: title,
      message: message,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      type: 'info',
      icon: 'info'
    });
  }
}