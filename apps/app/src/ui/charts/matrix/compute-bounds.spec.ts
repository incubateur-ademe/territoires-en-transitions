import { describe, expect, it } from 'vitest';
import { computeBounds } from './compute-bounds';

describe('computeBounds', () => {
  it('takes the upper corner of the declared quadrants', () => {
    expect(
      computeBounds({
        quadrants: [
          { from: { x: 0, y: 36 }, to: { x: 70, y: 120 } },
          { from: { x: 70, y: 0 }, to: { x: 100, y: 36 } },
        ],
        points: [{ x: 50, y: 107 }],
      })
    ).toEqual({ x: 100, y: 120 });
  });

  it('ignores points that overflow the declared quadrants', () => {
    expect(
      computeBounds({
        quadrants: [{ from: { x: 0, y: 0 }, to: { x: 100, y: 120 } }],
        points: [{ x: 50, y: 400 }],
      }).y
    ).toBe(120);
  });

  it('rounds up to the next ten without any quadrant', () => {
    expect(
      computeBounds({ quadrants: [], points: [{ x: 95, y: 107 }] })
    ).toEqual({ x: 100, y: 110 });
  });

  it('leaves an already round bound untouched', () => {
    expect(
      computeBounds({ quadrants: [], points: [{ x: 40, y: 60 }] })
    ).toEqual({ x: 40, y: 60 });
  });

  it('bounds an empty matrix at the origin', () => {
    expect(computeBounds({ quadrants: [], points: [] })).toEqual({
      x: 0,
      y: 0,
    });
  });
});
