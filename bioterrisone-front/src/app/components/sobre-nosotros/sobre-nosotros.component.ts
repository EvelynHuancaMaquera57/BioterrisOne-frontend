import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ← ESTE ES EL IMPORT QUE FALTA

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  imports: [CommonModule], // ← AGREGA CommonModule AQUÍ
  templateUrl: './sobre-nosotros.component.html',
  styleUrl: './sobre-nosotros.component.scss'
})
export class SobreNosotrosComponent {
  selectedContent: string = '';

  showContent(contentType: string) {
    this.selectedContent = contentType;
  }
}