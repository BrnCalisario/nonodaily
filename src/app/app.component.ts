import { AfterViewInit, Component, DestroyRef, ElementRef, inject, signal, TemplateRef, viewChild, viewChildren } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CellComponent } from './components/cell/cell.component';
import { heart } from './data/heart';
import { Cell, CellState } from './models/cell.model';
import { filter, fromEvent, merge, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  public heart = heart;

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

  private mousedown$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(
    tap(() => this.holding.set(true)),
    tap((event) => event.preventDefault()),
  );

  private mouseup$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(
    tap(() => this.holding.set(false)),
    tap((event) => event.preventDefault()),
  );

  private preventContextMenu = this.grid$.pipe(
    switchMap(({ nativeElement }) => fromEvent<PointerEvent>(nativeElement, 'contextmenu')),
    tap((event) => event.preventDefault())
  );

  private gridMouseDown$ = this.grid$.pipe(
    switchMap(({ nativeElement }) => fromEvent<MouseEvent>(nativeElement, 'mousedown')),
    tap(({ target, button }) => {
      const id = Number((target as HTMLElement).id);

      const oldValue = this.grid[id].state;

      const value = button === 0 ? 'filled' : 'marked';

      const state = oldValue === value ? 'empty' : value;

      this.pencil.set(state);
      this.paintCell(id, state);
    })
  );

  private cellMouseEnter$ = this.cells$.pipe(
    switchMap(elements => {
      return merge(...elements.map(e => fromEvent<MouseEvent>(e.nativeElement, 'mouseenter'))).pipe(
        filter(() => this.holding()),
        tap(({ target }) => {
          const id = Number((target as HTMLElement).id);
          this.paintCell(id, this.pencil()!)
        })
      )
    })
  );

  private paintCell(index: number, value: CellState) {
    const state = this.grid[index].state;

    if (state == value) return;

    this.grid[index].state = value;
  }

  constructor() {
    this.mousedown$.subscribe();
    this.mouseup$.subscribe();
    this.gridMouseDown$.subscribe();
    this.cellMouseEnter$.subscribe();
    this.preventContextMenu.subscribe();
  }

  public ngAfterViewInit(): void {
    var game = document.getElementById("game");

    if (!game) return;

    const cellSize = this.GRID_BOX / this.WIDTH;

    game.style.setProperty('--cell-size', `${cellSize}px`);
    game.style.setProperty('--rows', `${this.HEIGHT}`);
    game.style.setProperty('--columns', `${this.WIDTH}`);
  }

  public buildHints(size: number): number[][] {
    return Array.from(Array(5)).map((_, i) => {

      const foo = Array.from(Array(i + 1)).map(() => size - i)

      return foo;
    })
  }

  private buildEmptyGrid(): Cell[] {
    return Array.from(Array(this.WIDTH * this.HEIGHT)).map(() => {
      return { state: "empty" }
    });
  };
}
