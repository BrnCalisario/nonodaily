import { AfterViewInit, Component, contentChildren, DestroyRef, ElementRef, inject, QueryList, Signal, signal, viewChild, ViewChildren, viewChildren } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { concatMap, debounce, debounceTime, filter, fromEvent, map, merge, mergeMap, of, switchMap, takeUntil, tap } from 'rxjs';
import { CellComponent } from './components/cell/cell.component';
import { Cell } from './models/cell.model';
import { heart } from './data/heart';

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

  public destroyRef = inject(DestroyRef);

  public gridComponent = viewChild.required('gridComponent', { read: ElementRef });

  public grid$ = toObservable(this.gridComponent);

  public grid = this.buildEmptyGrid();

  private gridClick$ = this.grid$.pipe(
    switchMap((grid) => fromEvent<PointerEvent>(grid.nativeElement, 'mousedown')),
    map(event => event.target),
    filter(Boolean),
    tap(target => this.changeCellState(target as HTMLElement)),
  )

  private mousedown$ = fromEvent(document, 'mousedown').pipe(
    tap((event => event.preventDefault())),
    tap(() => this.holding.set(true))
  ).subscribe();

  private mouseup$ = fromEvent(document, 'mouseup').pipe(
    tap((event => event.preventDefault())),
    tap(() => this.holding.set(false))
  ).subscribe();

  private cellComponents = viewChildren(CellComponent, { read: ElementRef });

  private mouseenter$ = toObservable(this.cellComponents).pipe(
    switchMap(elements => {
      return merge(...elements.map(e => fromEvent<PointerEvent>(e.nativeElement, 'mouseenter'))).pipe(
        filter(() => this.holding()),
        tap((event) => this.changeCellState(event.target as HTMLElement))
      )
    })
  )

  foo$ = merge(this.gridClick$, this.mouseenter$).subscribe();

  private changeCellState(target: HTMLElement, value?: "filled" | "empty" | "marked"): void {
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
