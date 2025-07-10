// src/app/shared/confirm-dialog/confirm-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog-container">
      <div class="dialog-header" [ngClass]="data.type || 'warning'">
        <div class="icon-container">
          <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
        </div>
        <h2 class="dialog-title">{{ data.title }}</h2>
      </div>
      
      <div class="dialog-content">
        <p class="dialog-message">{{ data.message }}</p>
      </div>
      
      <div class="dialog-actions">
        <button 
          mat-button 
          class="cancel-button"
          (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          [class]="getConfirmButtonClass()"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog-container {
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
      max-width: 450px;
      width: 100%;
    }

    .dialog-header {
      padding: 24px 24px 16px 24px;
      text-align: center;
      position: relative;
    }

    .dialog-header.warning {
      background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
    }

    .dialog-header.danger {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    }

    .dialog-header.info {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    }

    .icon-container {
      margin-bottom: 16px;
    }

    .icon-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }

    .icon-container mat-icon.warning-icon {
      color: #fff3e0;
    }

    .icon-container mat-icon.danger-icon {
      color: #ffebee;
    }

    .icon-container mat-icon.info-icon {
      color: #e3f2fd;
    }

    .dialog-title {
      margin: 0;
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .dialog-content {
      padding: 24px;
      background-color: #fafafa;
    }

    .dialog-message {
      margin: 0;
      color: #424242;
      font-size: 1rem;
      line-height: 1.6;
      text-align: center;
    }

    .dialog-actions {
      padding: 16px 24px 24px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background-color: #fafafa;
    }

    .cancel-button {
      color: #757575;
      border: 1px solid #e0e0e0;
      background-color: white;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      background-color: #f5f5f5;
      border-color: #bdbdbd;
    }

    .confirm-button-warning {
      background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
      color: white;
      border: none;
      transition: all 0.3s ease;
    }

    .confirm-button-warning:hover {
      background: linear-gradient(135deg, #f57c00 0%, #e64a19 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
    }

    .confirm-button-danger {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      border: none;
      transition: all 0.3s ease;
    }

    .confirm-button-danger:hover {
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
    }

    .confirm-button-info {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      border: none;
      transition: all 0.3s ease;
    }

    .confirm-button-info:hover {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .confirm-dialog-container {
        margin: 16px;
        max-width: none;
      }

      .dialog-header {
        padding: 20px 20px 12px 20px;
      }

      .dialog-content {
        padding: 20px;
      }

      .dialog-actions {
        padding: 12px 20px 20px 20px;
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getIcon(): string {
    if (this.data.icon) {
      return this.data.icon;
    }
    
    switch (this.data.type) {
      case 'danger':
        return 'delete_forever';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'danger-icon';
      case 'warning':
        return 'warning-icon';
      case 'info':
        return 'info-icon';
      default:
        return 'warning-icon';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'confirm-button-danger';
      case 'warning':
        return 'confirm-button-warning';
      case 'info':
        return 'confirm-button-info';
      default:
        return 'confirm-button-warning';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
} 