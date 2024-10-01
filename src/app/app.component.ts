import { AfterViewInit, Component, DestroyRef, ElementRef, inject, signal, TemplateRef, viewChild, viewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CellComponent } from './components/cell/cell.component';
import { heart, Hint } from './data/heart';
import { Cell, CellState } from './models/cell.model';
import { filter, fromEvent, merge, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CellComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  public heart = heart;

  public leftHints: Hint[][];
  public topHints: Hint[][];

  public readonly WIDTH = 5;
  public readonly HEIGHT = 5;
  public readonly GRID_BOX = 400;
  private readonly destroyRef = inject(DestroyRef);

  public grid = this.buildEmptyGrid();

  protected holding = signal(false);
  protected pencil = signal<CellState | null>(null);

  private _grid = viewChild.required<ElementRef>('gridComponent');
  private grid$ = toObservable(this._grid);

  private _cells = viewChildren('cell', { read: ElementRef });
  private cells$ = toObservable(this._cells);

  constructor() {
    this.initializeMouseEvents();

    this.leftHints = heart.leftHints.map(l => l.map(value => ({ ...new Hint(), value })));
    this.topHints = heart.topHints.map(t => t.map(value => ({ ...new Hint(), value })));
  }

  public ngAfterViewInit(): void {
    this.setGridStyles();
  }

  private initializeMouseEvents() {
    const mouseDown$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(
      tap(() => this.holding.set(true)),
      tap(event => event.preventDefault()),
      takeUntilDestroyed(this.destroyRef)
    );

    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(
      tap(() => this.holding.set(false)),
      tap(event => event.preventDefault()),
      takeUntilDestroyed(this.destroyRef)
    );

    const preventContextMenu$ = this.grid$.pipe(
      switchMap(({ nativeElement }) => fromEvent<PointerEvent>(nativeElement, 'contextmenu')),
      tap(event => event.preventDefault()),
      takeUntilDestroyed(this.destroyRef)
    );

    const gridMouseDown$ = this.grid$.pipe(
      switchMap(({ nativeElement }) => fromEvent<MouseEvent>(nativeElement, 'mousedown')),
      tap(event => this.handleGridMouseDown(event)),
      takeUntilDestroyed(this.destroyRef)
    );

    const cellMouseEnter$ = this.cells$.pipe(
      switchMap(elements =>
        merge(...elements.map(e => fromEvent<MouseEvent>(e.nativeElement, 'mouseenter'))).pipe(
          filter(() => this.holding()),
          tap(event => this.handleCellMouseEnter(event)),
          takeUntilDestroyed(this.destroyRef)
        )
      )
    );

    mouseDown$.subscribe();
    mouseUp$.subscribe();
    preventContextMenu$.subscribe();
    gridMouseDown$.subscribe();
    cellMouseEnter$.subscribe();
  }

  private handleGridMouseDown({ target, button }: MouseEvent): void {
    const id = Number((target as HTMLElement).id);

    const previewState = this.grid[id].state;
    const newState = this.getNewState(button, previewState);

    this.pencil.set(newState);
    this.paintCell(id, newState);
  }

  private handleCellMouseEnter({ target }: MouseEvent): void {
    const id = Number((target as HTMLElement).id);
    this.paintCell(id, this.pencil()!);
  }

  private getNewState(button: number, currentState: CellState): CellState {
    const state = button === 0 ? 'filled' : 'marked';
    return currentState === state ? 'empty' : state;
  }

  private paintCell(index: number, value: CellState) {
    const state = this.grid[index].state;

    if (state == value) return;

    this.grid[index].state = value;

    const row = Math.floor(index / this.WIDTH);
    const column = index % this.HEIGHT;

    const rowClusters = this.findRowClusters(row);

    const columnClusters = this.findColumnClusters(column);

    const rowCompleted = this.compareHints(rowClusters, this.heart.leftHints[row]);
    this.leftHints[row].forEach(o => o.complete = rowCompleted);

    const columnCompleted = this.compareHints(columnClusters, this.heart.topHints[column]);
    this.topHints[column].forEach(o => o.complete = columnCompleted);

    if (rowCompleted) {
      let start = Math.floor(row * this.WIDTH);

      for (let i = start; i < start + this.WIDTH; i++) {

        const cell = this.grid[i].state;

        if (cell == 'filled') continue;

        this.grid[i].state = 'marked';
      }
    }

    if (columnCompleted) {
      let start = column;

      for (let j = start; j <= (this.WIDTH * this.HEIGHT) - (this.WIDTH - column); j += this.WIDTH) {
        const cell = this.grid[j].state;

        if (cell == 'filled') continue;

        this.grid[j].state = 'marked';
      }
    }
  }

  private setGridStyles(): void {
    const game = document.getElementById("game");

    if (!game) return;

    const cellSize = this.GRID_BOX / this.WIDTH;
    game.style.setProperty('--cell-size', `${cellSize}px`);
    game.style.setProperty('--rows', `${this.HEIGHT}`);
    game.style.setProperty('--columns', `${this.WIDTH}`);
  }

  public buildHints(size: number): number[][] {
    return Array.from({ length: 5 }, (_, i) => Array(i + 1).fill(size - i));
  }

  private buildEmptyGrid(): Cell[] {
    return Array.from({ length: this.WIDTH * this.HEIGHT }, () => ({ state: "empty" }));
  }

  private findRowClusters(row: number): number[] {
    const start = this.WIDTH * row
    const step = 1;
    const limit = (row * this.WIDTH) + this.WIDTH - 1;

    return this.findClusters(start, step, limit);
  }

  private findColumnClusters(column: number): number[] {
    const start = column;
    const step = this.WIDTH;
    const limit = (this.WIDTH * this.HEIGHT) - (this.WIDTH - column);

    return this.findClusters(start, step, limit);
  }

  private findClusters(start: number, step: number, limit: number): number[] {
    let cluster = 0;
    let clusters = [];

    for (let i = start; i <= limit; i += step) {

      let condition = this.grid[i].state == 'filled';

      if (condition) {
        cluster++;
      }

      if (!condition && cluster > 0) {
        clusters.push(cluster);
        cluster = 0;
      }

      if (i == limit && cluster > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  public compareHints(a: number[], b: number[]) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
