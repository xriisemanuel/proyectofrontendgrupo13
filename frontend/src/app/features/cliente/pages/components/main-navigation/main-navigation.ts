import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MainButton {
  name: string;
  active: boolean;
  key: string;
}

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.css'
})
export class MainNavigation {
  @Input() buttons: MainButton[] = [];
  @Input() loading: boolean = false;
  @Output() buttonSelected = new EventEmitter<string>();

  onButtonClick(button: MainButton): void {
    if (!this.loading) {
      this.buttonSelected.emit(button.key);
    }
  }
}
