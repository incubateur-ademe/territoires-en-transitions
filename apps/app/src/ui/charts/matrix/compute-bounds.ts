import type { MatrixCoord } from './matrix-coord';
import type { QuadrantProps } from './quadrant';

const ROUNDING_STEP = 10;

const roundUp = (value: number): number =>
  Math.ceil(value / ROUNDING_STEP) * ROUNDING_STEP;

const computeBounds = ({
  quadrants,
  points,
}: {
  quadrants: readonly QuadrantProps[];
  points: readonly MatrixCoord[];
}): MatrixCoord => {
  if (quadrants.length > 0) {
    return {
      x: Math.max(...quadrants.map(({ to }) => to.x)),
      y: Math.max(...quadrants.map(({ to }) => to.y)),
    };
  }

  return {
    x: roundUp(Math.max(0, ...points.map(({ x }) => x))),
    y: roundUp(Math.max(0, ...points.map(({ y }) => y))),
  };
};

export { computeBounds };
