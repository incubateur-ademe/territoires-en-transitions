import { describe, expect, it } from 'vitest';
import {
  placeLabels,
  type Box,
  type LabelPlacements,
  type LabelRequest,
} from './place-labels';

const AREA: Box = { left: 0, top: 0, right: 500, bottom: 300 };

const place = ({
  labels,
  obstacles = [],
}: {
  labels: LabelRequest[];
  obstacles?: Box[];
}): LabelPlacements =>
  placeLabels({
    labels,
    area: AREA,
    obstacles,
    labelHeight: 15,
    gapToPoint: 10,
  });

describe('placeLabels', () => {
  it('sits a lone label right of its point, at its height', () => {
    expect(
      place({ labels: [{ dataIndex: 0, pointX: 100, pointY: 150, width: 80 }] })
    ).toEqual({ 0: { x: 110, y: 150, side: 'right' } });
  });

  it('flips a label left of its point when it would overflow the right edge', () => {
    expect(
      place({ labels: [{ dataIndex: 0, pointX: 460, pointY: 150, width: 80 }] })
    ).toEqual({ 0: { x: 450, y: 150, side: 'left' } });
  });

  it('leaves two labels far apart on the abscissa at their own height', () => {
    expect(
      place({
        labels: [
          { dataIndex: 0, pointX: 0, pointY: 150, width: 80 },
          { dataIndex: 1, pointX: 300, pointY: 150, width: 80 },
        ],
      })
    ).toEqual({
      0: { x: 10, y: 150, side: 'right' },
      1: { x: 310, y: 150, side: 'right' },
    });
  });

  it('puts the second of two overlapping labels on the other side of its point', () => {
    expect(
      place({
        labels: [
          { dataIndex: 0, pointX: 100, pointY: 150, width: 80 },
          { dataIndex: 1, pointX: 120, pointY: 150, width: 80 },
        ],
      })
    ).toEqual({
      0: { x: 110, y: 150, side: 'right' },
      1: { x: 110, y: 150, side: 'left' },
    });
  });

  it('moves a label up rather than below the bottom of the plot when neither side is free', () => {
    expect(
      place({
        labels: [
          { dataIndex: 0, pointX: 20, pointY: 290, width: 80 },
          { dataIndex: 1, pointX: 40, pointY: 290, width: 80 },
        ],
      })
    ).toEqual({
      0: { x: 30, y: 290, side: 'right' },
      1: { x: 50, y: 275, side: 'right' },
    });
  });

  it('puts a label on the other side of its point to avoid an obstacle such as a quadrant title', () => {
    expect(
      place({
        labels: [{ dataIndex: 0, pointX: 100, pointY: 150, width: 80 }],
        obstacles: [{ left: 150, top: 140, right: 250, bottom: 160 }],
      })
    ).toEqual({ 0: { x: 90, y: 150, side: 'left' } });
  });

  it('steps a label to the nearest free height when both sides are blocked', () => {
    expect(
      place({
        labels: [{ dataIndex: 0, pointX: 100, pointY: 150, width: 80 }],
        obstacles: [{ left: 0, top: 140, right: 500, bottom: 160 }],
      })
    ).toEqual({ 0: { x: 110, y: 180, side: 'right' } });
  });

  it('places no label when no free place exists within three steps', () => {
    expect(
      place({
        labels: [{ dataIndex: 0, pointX: 100, pointY: 150, width: 80 }],
        obstacles: [AREA],
      })
    ).toEqual({});
  });

  it('keys placements by dataIndex rather than by ascending ordinate', () => {
    expect(
      place({
        labels: [
          { dataIndex: 0, pointX: 100, pointY: 250, width: 80 },
          { dataIndex: 1, pointX: 100, pointY: 50, width: 80 },
        ],
      })
    ).toEqual({
      0: { x: 110, y: 250, side: 'right' },
      1: { x: 110, y: 50, side: 'right' },
    });
  });

  it('places nothing for a matrix without labels', () => {
    expect(place({ labels: [] })).toEqual({});
  });
});
