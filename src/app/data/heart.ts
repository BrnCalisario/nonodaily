export const heart = {
  rows: 5,
  columns: 5,
  topHints: [
    [2],
    [4],
    [4],
    [4],
    [2],
  ],
  leftHints: [
    [1, 1],
    [5],
    [5],
    [3],
    [1]
  ],
};

export class Hint {
  value: number = 0;
  complete: boolean = false;
}
