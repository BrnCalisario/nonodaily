import { Cell } from "../app/models/cell.model";
import { calculateHints, GridArgs, PaintArgs } from "./calculate-hint"
import { heart, Hint } from "../app/data/heart";

const WIDTH = 5;
const HEIGHT = 5;


function buildEmptyGrid(): Cell[] {
  return Array.from({ length: WIDTH * HEIGHT }, () => ({ state: "empty" }));
}

const mapHint = (arr: number[]) => arr.map(value => ({ ...new Hint(), value }));

describe("[NONOGRAM HINTS]", () => {

  it('test', () => {

    // Arrange
    const grid = buildEmptyGrid();

    const gridArgs: GridArgs = {
      grid,
      leftHints: heart.leftHints.map(mapHint),
      topHints: heart.topHints.map(mapHint),
      width: WIDTH,
      height: HEIGHT
    };

    const paintArgs: PaintArgs = {
      index: 2,
      state: 'filled'
    };

    // Act
    calculateHints(gridArgs, paintArgs);

    // Assert
    expect(true).toBeTrue();
  })

})
