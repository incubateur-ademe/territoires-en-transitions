import { describe, expect, it } from 'vitest';
import {
  stackLabelsVertically,
  type LabelAnchor,
  type LabelPlacements,
} from './stack-labels';

describe('stackLabelsVertically', () => {
  const stack = (
    anchors: LabelAnchor[]
  ): LabelPlacements =>
    stackLabelsVertically({ anchors, labelHeight: 15, gapToPoint: 10 });

  it('sits a lone label just above its point', () => {
    expect(stack([{ dataIndex: 0, x: 100, y: 200 }])).toEqual({
      0: { x: 100, y: 190 },
    });
  });

  it('separates two labels sharing an ordinate by one label height', () => {
    expect(
      stack([
        { dataIndex: 0, x: 100, y: 200 },
        { dataIndex: 1, x: 300, y: 200 },
      ])
    ).toEqual({ 0: { x: 100, y: 190 }, 1: { x: 300, y: 205 } });
  });

  it('stacks even labels that are far apart on the abscissa', () => {
    expect(
      stack([
        { dataIndex: 0, x: 0, y: 200 },
        { dataIndex: 1, x: 900, y: 200 },
      ])
    ).toEqual({ 0: { x: 0, y: 190 }, 1: { x: 900, y: 205 } });
  });

  it('leaves alone two points already further apart than a label height', () => {
    expect(
      stack([
        { dataIndex: 0, x: 100, y: 100 },
        { dataIndex: 1, x: 100, y: 300 },
      ])
    ).toEqual({ 0: { x: 100, y: 90 }, 1: { x: 100, y: 290 } });
  });

  it('keys placements by dataIndex rather than by ascending ordinate', () => {
    expect(
      stack([
        { dataIndex: 0, x: 100, y: 300 },
        { dataIndex: 1, x: 100, y: 100 },
      ])
    ).toEqual({ 0: { x: 100, y: 290 }, 1: { x: 100, y: 90 } });
  });

  it('places nothing for a matrix without points', () => {
    expect(stack([])).toEqual({});
  });
});
