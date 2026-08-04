import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 4936,
}));

import { getDemarchePcaetDraft } from './demarche-pcaet-draft.storage';
import { usePcaetGridState } from './use-pcaet-grid-state';

describe('usePcaetGridState', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('persiste la mise a jour dans le brouillon de la demarche', () => {
    const { result } = renderHook(() => usePcaetGridState(42, 'enr'));

    let persisted: boolean | undefined;
    act(() => {
      persisted = result.current[1](() => ({ referenceYear: 2019 }));
    });

    expect(persisted).toBe(true);
    expect(result.current[0].referenceYear).toBe(2019);
    expect(getDemarchePcaetDraft(4936, 42).gridStates.enr?.referenceYear).toBe(
      2019
    );
  });

  it('isole les brouillons de deux demarches distinctes', () => {
    const { result } = renderHook(() => usePcaetGridState(1, 'enr'));

    act(() => {
      result.current[1](() => ({ referenceYear: 2020 }));
    });

    expect(getDemarchePcaetDraft(4936, 1).gridStates.enr?.referenceYear).toBe(
      2020
    );
    expect(
      getDemarchePcaetDraft(4936, 2).gridStates.enr?.referenceYear
    ).toBeUndefined();
  });
});
