import { Component, Input } from '@angular/core';
import { Cell } from '../../models/cell.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss'
})
export class CellComponent {

  @Input({ required: true })
  data!: Cell;
}
