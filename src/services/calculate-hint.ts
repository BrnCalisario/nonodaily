import { Hint } from "../app/data/heart";
import { Cell, CellState } from "../app/models/cell.model";

export type GridArgs = {
  grid: Cell[];
  topHints: Hint[][];
  leftHints: Hint[][];
  width: number;
  height: number;
}

export type PaintArgs = {
  index: number;
  state: CellState;
}

export function calculateHints(grid: GridArgs, paint: PaintArgs): void {
  var row = Math.floor(paint.index / grid.height);
  var col = paint.index % grid.width;

  const clusters = findRowHints(grid, row);
}

function findRowHints({ width, grid }: GridArgs, row: number): number[] {
  const start = width * row;
  const step = 1;
  const limit = (row * width) + width - 1;

  return findClusters(grid, start, step, limit);
}

export function findClusters(grid: Cell[], start: number, step: number, limit: number): number[] {
  let cluster = 0;
  let clusters = [];

  for (let i = start; i <= limit; i += step) {

    let condition = grid[i].state == 'filled';

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
