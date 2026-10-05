import type { MatrixCoord } from './matrix-coord';
import type { MatrixGrid } from './matrix-grid';
type PlotSize = {
  width: number;
  height: number;
};

type ProjectedPoint = {
  dataIndex: number;
  x: number;
  y: number;
};

const projectPoints = ({
  points,
  bounds,
  grid,
  size,
}: {
  points: readonly MatrixCoord[];
  bounds: MatrixCoord;
  grid: MatrixGrid;
  size: PlotSize;
}): ProjectedPoint[] => {
  const plotWidth = size.width - grid.left - grid.right;
  const plotHeight = size.height - grid.top - grid.bottom;
  const isPlottable =
    plotWidth > 0 && plotHeight > 0 && bounds.x > 0 && bounds.y > 0;

  if (!isPlottable) {
    return [];
  }

  return points.map((point, dataIndex) => ({
    dataIndex,
    x: grid.left + (point.x / bounds.x) * plotWidth,
    y: size.height - grid.bottom - (point.y / bounds.y) * plotHeight,
  }));
};

export { projectPoints };
export type { PlotSize, ProjectedPoint };
