import { act, renderHook } from '@testing-library/react';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { useIndicateurDisplayPeriodicite } from './use-indicateur-display-periodicite';

const monthlyIndicator = {
  indicateurId: 7,
  collectiviteId: 42,
  periodicite: 'mensuelle' as IndicateurPeriodicite,
};

describe('local indicator display preference', () => {
  it('defaults to declaration cadence and changes display independently', () => {
    const { result } = renderHook(() =>
      useIndicateurDisplayPeriodicite(monthlyIndicator)
    );
    expect(result.current.periodiciteAffichage).toBe('mensuelle');

    act(() => result.current.setPeriodiciteAffichage('annuelle'));

    expect(result.current.periodiciteAffichage).toBe('annuelle');
    expect(monthlyIndicator.periodicite).toBe('mensuelle');
  });

  it.each([
    { indicateurId: 8 },
    { collectiviteId: 43 },
    { periodicite: 'annuelle' as IndicateurPeriodicite },
  ])('resets when the chart context changes: %j', (change) => {
    const { result, rerender } = renderHook(useIndicateurDisplayPeriodicite, {
      initialProps: monthlyIndicator,
    });
    act(() => result.current.setPeriodiciteAffichage('annuelle'));

    rerender({ ...monthlyIndicator, ...change });
    expect(result.current.periodiciteAffichage).toBe(
      change.periodicite ?? monthlyIndicator.periodicite
    );
    rerender(monthlyIndicator);
    expect(result.current.periodiciteAffichage).toBe('mensuelle');
  });

  it('rejects monthly display for annual declarations', () => {
    const { result } = renderHook(() =>
      useIndicateurDisplayPeriodicite({
        ...monthlyIndicator,
        periodicite: 'annuelle',
      })
    );

    expect(() => result.current.setPeriodiciteAffichage('mensuelle')).toThrow();
    expect(result.current.periodiciteAffichage).toBe('annuelle');
  });
});
