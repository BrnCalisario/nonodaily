import { Component, contentChildren, DestroyRef, ElementRef, inject, QueryList, Signal, signal, ViewChildren, viewChildren } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { concatMap, fromEvent, merge, mergeMap, switchMap, takeUntil, tap } from 'rxjs';
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

  public cellComponents = viewChildren(CellComponent, { read: ElementRef });
  public cells$ = toObservable(this.cellComponents);

  public grid = this.buildEmptyGrid();

  public foo$ = this.cells$.pipe(
    switchMap((cells) => {
      return merge(...cells.map((cell: ElementRef) => fromEvent(cell.nativeElement, 'click').pipe(
        tap(() => this.changeCellState(cell))
      )));
    }),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe();

  private changeCellState(cell: ElementRef): void {
    const index = this.cellComponents().indexOf(cell);

    if (index === -1) return;

    this.grid[index].state = this.grid[index].state === 'empty' ? 'filled' : 'empty';
  }

  private buildEmptyGrid(): Cell[] {
    return Array.from(Array(25)).map(() => {
      return { state: "empty" }
    });
  }
}
