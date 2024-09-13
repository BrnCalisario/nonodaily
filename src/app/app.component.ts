import { AfterViewInit, Component, DestroyRef, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { combineLatest, filter, fromEvent, map, merge, switchMap, tap } from 'rxjs';
import { CellComponent } from './components/cell/cell.component';
import { heart } from './data/heart';
import { Cell, CellState } from './models/cell.model';

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

  holding = signal(false);

  pencil = signal<CellState | null>(null);

  public destroyRef = inject(DestroyRef);

  public gridComponent = viewChild.required('gridComponent', { read: ElementRef });

  public grid$ = toObservable(this.gridComponent);

  public grid = this.buildEmptyGrid();

  private gridClick$ = this.grid$.pipe(
    switchMap((grid) => fromEvent<PointerEvent>(grid.nativeElement, 'mousedown')),
    map(event => event.target),
    filter(Boolean),
    tap(target => this.changeCellState(target as HTMLElement, this.pencil())),
  )

  private mousedown$ = fromEvent(document, 'mousedown').pipe(
    tap((event => event.preventDefault())),
    tap((event) => {
      const { classList } = event.target as HTMLElement;
      const value = classList.contains('filled') ? 'empty' : 'filled';
      this.pencil.set(value)
    }),
    tap(() => this.holding.set(true))
  );

  private mouseup$ = fromEvent(document, 'mouseup').pipe(
    tap((event => event.preventDefault())),
    tap(() => this.pencil.set(null)),
    tap(() => this.holding.set(false))
  );
  private cellComponents = viewChildren(CellComponent, { read: ElementRef });

  private mouseenter$ = toObservable(this.cellComponents).pipe(
    switchMap(elements => {
      return merge(...elements.map(e => fromEvent<PointerEvent>(e.nativeElement, 'mouseenter'))).pipe(
        filter(() => this.holding()),
        tap((event) => this.changeCellState(event.target as HTMLElement, this.pencil()))
      )
    })
  )

  foo$ = merge(this.gridClick$, this.mouseenter$).subscribe();

  constructor() {
    this.mousedown$.subscribe();
    this.mouseup$.subscribe();
  }

  private changeCellState(target: HTMLElement, value?: CellState | null): void {
    const cell = this.cellComponents().find(c => c.nativeElement == target || c.nativeElement === target.parentElement);

    if (!cell) return;

    const index = this.cellComponents().indexOf(cell);

    if (!value) {
      this.grid[index].state = this.grid[index].state === 'empty' ? 'filled' : 'empty';
    } else {
      this.grid[index].state = value;
    }
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
