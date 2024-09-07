import { Component, contentChildren, DestroyRef, ElementRef, inject, QueryList, Signal, signal, viewChild, ViewChildren, viewChildren } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { concatMap, filter, fromEvent, map, merge, mergeMap, switchMap, takeUntil, tap } from 'rxjs';
import { CellComponent } from './components/cell/cell.component';
import { Cell } from './models/cell.model';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  public destroyRef = inject(DestroyRef);

  public gridComponent = viewChild.required('gridComponent', { read: ElementRef });

  public grid$ = toObservable(this.gridComponent);

  public grid = this.buildEmptyGrid();

  private gridClick$ = this.grid$.pipe(
    switchMap((grid) => fromEvent<PointerEvent>(grid.nativeElement, 'click')),
    map(event => event.target),
    filter(Boolean),
    tap(target => this.changeCellState(target as HTMLElement)),
  ).subscribe();

  private cellComponents = viewChildren(CellComponent, { read: ElementRef });

  private changeCellState(target: HTMLElement): void {

    const cell = this.cellComponents().find(c => c.nativeElement === target.parentElement);

    if (!cell) return;

    const index = this.cellComponents().indexOf(cell);

    this.grid[index].state = this.grid[index].state === 'empty' ? 'filled' : 'empty';
  }

  private buildEmptyGrid(): Cell[] {
    return Array.from(Array(25)).map(() => {
      return { state: "empty" }
    });
  }
}
