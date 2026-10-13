import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatrixChart, type MatrixPoint } from './matrix.chart';

const PLOT_SIZE = { width: 536, height: 404 };

const toPoint = (overrides: Partial<MatrixPoint>): MatrixPoint => ({
  id: 'point',
  label: 'Point',
  description: 'Description',
  tone: 'default',
  x: 0,
  y: 0,
  ...overrides,
});

const SMALL = toPoint({ id: 'small', x: 10, y: 10 });
const LARGE = toPoint({ id: 'large', x: 100, y: 100 });

class FixedSizeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element): void {
    this.callback(
      [{ target, contentRect: PLOT_SIZE } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }

  unobserve(): void {}

  disconnect(): void {}
}

const renderAnchoredTo = (pointId: string): HTMLElement | null => {
  let anchorElement: HTMLElement | null = null;
  render(
    <MatrixChart
      data={[SMALL, LARGE]}
      anchor={{
        pointId,
        elementRef: (element) => {
          anchorElement = element;
        },
      }}
    />
  );
  return anchorElement;
};

const toCenter = (element: HTMLElement): { x: number; y: number } => ({
  x: parseFloat(element.style.left) + parseFloat(element.style.width) / 2,
  y: parseFloat(element.style.top) + parseFloat(element.style.height) / 2,
});

describe('MatrixChart anchor', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FixedSizeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pose l'ancre invisible sur le point demandé", () => {
    const largeAnchor = renderAnchoredTo('large');

    expect(largeAnchor && toCenter(largeAnchor)).toEqual({ x: 496, y: 40 });
  });

  it('suit le point demandé, pas le premier de la liste', () => {
    const smallAnchor = renderAnchoredTo('small');

    expect(smallAnchor && toCenter(smallAnchor)).toEqual({ x: 136, y: 310 });
  });

  it("ne rend aucune ancre quand le point demandé n'existe pas", () => {
    expect(renderAnchoredTo('absent')).toBeNull();
  });
});
