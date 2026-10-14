import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRevealIndicateurPeriode } from './use-reveal-indicateur-periode';

const periode = IndicateurPeriodes.fromYear(2024);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const setupViewport = (cellLeft: number, reducedMotion = false) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: reducedMotion })
  );
  const viewport = document.createElement('div');
  viewport.innerHTML = `<table><tbody><tr><td data-periode="${periode.dateDebut}" data-periodicite="${IndicateurPeriodiciteEnum.ANNUELLE}"></td><td data-pinned="right"></td></tr></tbody></table>`;
  Object.defineProperties(viewport, {
    clientWidth: { value: 800 },
    scrollWidth: { value: 2400 },
    scrollLeft: { value: 300 },
  });
  viewport.getBoundingClientRect = () => ({ left: 20 } as DOMRect);
  const cell = viewport.querySelector('td');
  const pinned = viewport.querySelector('[data-pinned]');
  if (!cell || !pinned) throw new Error('Fixture cells missing');
  cell.getBoundingClientRect = () =>
    ({ left: cellLeft, width: 200 } as DOMRect);
  pinned.getBoundingClientRect = () => ({ width: 200 } as DOMRect);
  viewport.scrollTo = vi.fn();
  return { viewport, scrollRef: { current: viewport } };
};

describe('useRevealIndicateurPeriode', () => {
  it.each([
    ['début', -280, 0],
    ['milieu', 1020, 1100],
    ['fin', 2020, 1600],
  ])(
    'révèle la période au %s en tenant compte de la colonne figée',
    (_, cellLeft, expectedLeft) => {
      const { viewport, scrollRef } = setupViewport(cellLeft as number);
      renderHook(() =>
        useRevealIndicateurPeriode(scrollRef, periode, [periode])
      );
      expect(viewport.scrollTo).toHaveBeenCalledWith({
        left: expectedLeft,
        behavior: 'smooth',
      });
    }
  );

  it('attend que la période soit affichée et ne déplace plus le tableau au rafraîchissement', () => {
    const { viewport, scrollRef } = setupViewport(1020);
    const { rerender } = renderHook(
      ({ periodes }) =>
        useRevealIndicateurPeriode(scrollRef, periode, periodes),
      { initialProps: { periodes: [] as (typeof periode)[] } }
    );
    expect(viewport.scrollTo).not.toHaveBeenCalled();
    rerender({ periodes: [periode] });
    rerender({ periodes: [periode, IndicateurPeriodes.fromYear(2025)] });
    expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
  });

  it('ne défile pas sans demande explicite', () => {
    const { viewport, scrollRef } = setupViewport(1020);
    renderHook(() =>
      useRevealIndicateurPeriode(scrollRef, undefined, [periode])
    );
    expect(viewport.scrollTo).not.toHaveBeenCalled();
  });

  it('respecte la préférence de réduction des animations', () => {
    const { viewport, scrollRef } = setupViewport(1020, true);
    renderHook(() => useRevealIndicateurPeriode(scrollRef, periode, [periode]));
    expect(viewport.scrollTo).toHaveBeenCalledWith({
      left: 1100,
      behavior: 'instant',
    });
  });
});
