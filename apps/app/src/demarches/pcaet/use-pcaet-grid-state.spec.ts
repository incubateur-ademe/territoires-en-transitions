import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 4936,
}));

import { createDemarchePcaet } from './demarche-pcaet.storage';
import { usePcaetGridState } from './use-pcaet-grid-state';

describe('usePcaetGridState', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('persiste la mise a jour et renvoie true quand la demarche existe', () => {
    const demarche = createDemarchePcaet({ collectiviteId: 4936 });
    const { result } = renderHook(() => usePcaetGridState(demarche.id, 'enr'));

    let persisted: boolean | undefined;
    act(() => {
      persisted = result.current[1](() => ({ referenceYear: 2019 }));
    });

    expect(persisted).toBe(true);
    expect(result.current[0].referenceYear).toBe(2019);
  });

  it('renvoie false et laisse le state inchange quand la demarche est introuvable', () => {
    const { result } = renderHook(() =>
      usePcaetGridState('demarche-inexistante', 'enr')
    );

    let persisted: boolean | undefined;
    act(() => {
      persisted = result.current[1](() => ({ referenceYear: 2019 }));
    });

    expect(persisted).toBe(false);
    expect(result.current[0].referenceYear).toBe(null);
  });
});
