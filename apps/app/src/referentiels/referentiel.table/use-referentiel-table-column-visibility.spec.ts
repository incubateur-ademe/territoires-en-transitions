import { useUser } from '@tet/api/users';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useReferentielTableColumnVisibility,
  useShowReferentielTableColumn,
} from './use-referentiel-table-column-visibility';

vi.mock('@tet/api/users', () => ({
  useUser: vi.fn(),
}));

const userId = 'e2b9c0a4-0000-4000-8000-000000000000';
const storageKey = `tet_referentiel_table_columns_visibility_${userId}`;

const setStoredVisibility = (visibility: Record<string, boolean>): void => {
  window.localStorage.setItem(storageKey, JSON.stringify(visibility));
};

const getStoredVisibility = (): Record<string, boolean> =>
  JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');

describe('useShowReferentielTableColumn', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(useUser).mockReturnValue({ id: userId } as ReturnType<
      typeof useUser
    >);
  });

  it("rend visible une colonne que l'utilisateur avait masquée", () => {
    setStoredVisibility({ statut: false, pilotes: false });

    const { result } = renderHook(() => useShowReferentielTableColumn());
    act(() => result.current('statut'));

    expect(getStoredVisibility()).toEqual({ statut: true, pilotes: false });
  });

  it('laisse visibles les autres colonnes déjà affichées', () => {
    setStoredVisibility({ statut: false, pilotes: true });

    const { result } = renderHook(() => useShowReferentielTableColumn());
    act(() => result.current('statut'));

    expect(getStoredVisibility()).toEqual({ statut: true, pilotes: true });
  });

  it('réaffiche la colonne statut détaillé avec la colonne statut', () => {
    setStoredVisibility({ statut: false });

    const { result: show } = renderHook(() => useShowReferentielTableColumn());
    act(() => show.current('statut'));

    const { result: visibility } = renderHook(() =>
      useReferentielTableColumnVisibility({ auditColumnsScope: 'none' })
    );

    expect(visibility.current.columnVisibility.statut).toBe(true);
    expect(visibility.current.columnVisibility.statutDetaille).toBe(true);
  });
});
