import { appLabels } from '@/app/labels/catalog';
import {
  documentQueryKeyBuilders,
  toReferentielQueryKeys,
} from '@/app/collectivites/documents/document-query-keys.fixture';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { JSX, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRemovePreuveFromDemande } from './useRemovePreuveFromDemande';

const COLLECTIVITE_ID = 1;
const REFERENTIEL_ID = 'cae';
const DEMANDE_ID = 7;
const PREUVE_ID = 42;
const REMOVE_PREUVE_KEY = ['documents', 'removePreuve'];

const DEMANDE = {
  id: DEMANDE_ID,
  collectiviteId: COLLECTIVITE_ID,
  referentiel: REFERENTIEL_ID,
};

const { mutationFn, setToast, parcours } = vi.hoisted(() => ({
  mutationFn: vi.fn(),
  setToast: vi.fn(),
  parcours: { demande: null as { id: number } | null },
}));

vi.mock('@tet/api', () => ({
  useTRPC: () => ({
    ...documentQueryKeyBuilders,
    collectivites: {
      ...documentQueryKeyBuilders.collectivites,
      documents: {
        ...documentQueryKeyBuilders.collectivites.documents,
        removePreuve: {
          mutationOptions: (options: Record<string, unknown>) => ({
            ...options,
            mutationKey: REMOVE_PREUVE_KEY,
            mutationFn,
          }),
        },
      },
    },
  }),
}));

vi.mock('../referentiel-context', () => ({
  useReferentielId: () => REFERENTIEL_ID,
}));

vi.mock('./useCycleLabellisation', () => ({
  useCycleLabellisation: () => ({ parcours }),
}));

vi.mock('@/app/utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast }),
}));

const renderRemovePreuveFromDemande = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRemovePreuveFromDemande(), {
    wrapper,
  });

  return { result, invalidateQueries };
};

describe('useRemovePreuveFromDemande', () => {
  beforeEach(() => {
    mutationFn.mockReset();
    mutationFn.mockResolvedValue(undefined);
    setToast.mockReset();
    parcours.demande = DEMANDE;
  });

  it('périme toutes les listes qui montrent le document supprimé', async () => {
    const { result, invalidateQueries } = renderRemovePreuveFromDemande();

    await act(async () => {
      result.current.removePreuve(PREUVE_ID);
    });

    expect(
      invalidateQueries.mock.calls.map(([filters]) => filters?.queryKey)
    ).toEqual([
      ...toReferentielQueryKeys(COLLECTIVITE_ID),
      ['listDocumentsDemandeLabellisation', DEMANDE_ID],
      ['getParcours', COLLECTIVITE_ID, REFERENTIEL_ID],
    ]);
  });

  it('supprime la preuve de candidature désignée', async () => {
    const { result } = renderRemovePreuveFromDemande();

    await act(async () => {
      result.current.removePreuve(PREUVE_ID);
    });

    expect(mutationFn.mock.calls).toEqual([
      [{ preuveId: PREUVE_ID, preuveType: 'labellisation' }],
    ]);
  });

  it('sans demande de labellisation en cours, ne supprime rien et le signale', async () => {
    parcours.demande = null;
    const { result, invalidateQueries } = renderRemovePreuveFromDemande();

    await act(async () => {
      result.current.removePreuve(PREUVE_ID);
    });

    expect(mutationFn).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledExactlyOnceWith(
      'error',
      appLabels.acteEngagementNoDemandeError
    );
  });

  it('signale un échec de suppression', async () => {
    mutationFn.mockRejectedValue(new Error('REMOVE_FAILED'));
    const { result } = renderRemovePreuveFromDemande();

    await act(async () => {
      result.current.removePreuve(PREUVE_ID);
    });

    expect(setToast).toHaveBeenCalledExactlyOnceWith(
      'error',
      appLabels.mutationError
    );
  });
});
