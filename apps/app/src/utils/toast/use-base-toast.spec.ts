import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBaseToast } from './use-base-toast';

describe('useBaseToast', () => {
  it('garde la même fonction setToast entre deux rendus, pour ne pas réarmer les effets qui en dépendent', () => {
    const { result, rerender } = renderHook(() => useBaseToast());
    const premierRendu = result.current.setToast;

    rerender();

    expect(result.current.setToast).toBe(premierRendu);
  });

  it("garde la même fonction setToast après l'affichage d'un message", () => {
    const { result } = renderHook(() => useBaseToast());
    const avantAffichage = result.current.setToast;

    act(() => {
      result.current.setToast('error', 'La génération a échoué');
    });

    expect(result.current.setToast).toBe(avantAffichage);
  });
});
