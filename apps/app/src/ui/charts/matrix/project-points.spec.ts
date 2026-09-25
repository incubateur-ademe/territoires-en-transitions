import { describe, expect, it } from 'vitest';
import { MATRIX_GRID } from './matrix-grid';
import type { MatrixCoord } from './matrix-coord';
import { projectPoints } from './project-points';
import type { LabelAnchor } from './stack-labels';

describe('projectPoints', () => {
  const project = (points: MatrixCoord[]): LabelAnchor[] =>
    projectPoints({
      points,
      bounds: { x: 100, y: 100 },
      grid: MATRIX_GRID,
      size: { width: 1000, height: 500 },
    });

  it('puts the origin at the bottom left of the plot area', () => {
    expect(project([{ x: 0, y: 0 }])).toEqual([
      { dataIndex: 0, x: 96, y: 436 },
    ]);
  });

  it('puts the upper bound at the top right of the plot area', () => {
    expect(project([{ x: 100, y: 100 }])).toEqual([
      { dataIndex: 0, x: 960, y: 40 },
    ]);
  });

  it('indexes anchors in the order the points came in', () => {
    expect(
      project([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]).map(({ dataIndex }) => dataIndex)
    ).toEqual([0, 1]);
  });

  it('projects nothing until the container has been measured', () => {
    expect(
      projectPoints({
        points: [{ x: 50, y: 50 }],
        bounds: { x: 100, y: 100 },
        grid: MATRIX_GRID,
        size: { width: 0, height: 0 },
      })
    ).toEqual([]);
  });

  it('projects nothing when the plot area is narrower than its margins', () => {
    expect(
      projectPoints({
        points: [{ x: 50, y: 50 }],
        bounds: { x: 100, y: 100 },
        grid: MATRIX_GRID,
        size: { width: 100, height: 500 },
      })
    ).toEqual([]);
  });

  it('projects nothing when the bounds are zero', () => {
    expect(
      projectPoints({
        points: [{ x: 0, y: 0 }],
        bounds: { x: 0, y: 0 },
        grid: MATRIX_GRID,
        size: { width: 1000, height: 500 },
      })
    ).toEqual([]);
  });
});
