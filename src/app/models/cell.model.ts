export type CellState = "filled" | "empty" | "marked";

export interface Cell {
  state: CellState;
}
