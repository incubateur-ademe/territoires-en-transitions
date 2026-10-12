import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSeenGuidedTourVersion } from './use-seen-guided-tour-version';

const STORAGE_KEY = 'tet_guided_tour_priorisation';

afterEach(() => {
  window.localStorage.clear();
});

describe('useSeenGuidedTourVersion', () => {
  it("considère la version non vue tant qu'elle n'est pas marquée, puis la mémorise", () => {
    const { result } = renderHook(() =>
      useSeenGuidedTourVersion({ id: 'priorisation', version: '2026-10' })
    );

    const beforeMark = result.current.hasSeen;
    act(() => result.current.markSeen());

    expect({
      beforeMark,
      afterMark: result.current.hasSeen,
      stored: window.localStorage.getItem(STORAGE_KEY),
    }).toEqual({ beforeMark: false, afterMark: true, stored: '2026-10' });
  });

  it('retrouve la version vue après un remontage', () => {
    window.localStorage.setItem(STORAGE_KEY, '2026-10');

    const { result } = renderHook(() =>
      useSeenGuidedTourVersion({ id: 'priorisation', version: '2026-10' })
    );

    expect(result.current.hasSeen).toBe(true);
  });

  it('réaffiche la visite quand sa version change', () => {
    window.localStorage.setItem(STORAGE_KEY, '2026-10');

    const { result } = renderHook(() =>
      useSeenGuidedTourVersion({ id: 'priorisation', version: '2026-11' })
    );

    expect(result.current.hasSeen).toBe(false);
  });

  it("ne mélange pas deux visites d'identifiants différents", () => {
    window.localStorage.setItem(STORAGE_KEY, '2026-10');

    const { result } = renderHook(() =>
      useSeenGuidedTourVersion({ id: 'indicateurs', version: '2026-10' })
    );

    expect(result.current.hasSeen).toBe(false);
  });
});
