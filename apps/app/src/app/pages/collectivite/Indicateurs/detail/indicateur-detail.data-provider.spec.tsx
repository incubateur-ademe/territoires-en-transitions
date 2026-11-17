import { renderHook } from '@testing-library/react';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurDetailDataProvider } from './indicateur-detail.data-provider';
import { useIndicateurActions } from './indicateur-actions.context';

const mocks = vi.hoisted(() => ({
  upsertValeur: vi.fn(),
  upsertPeriode: vi.fn(),
  removeValeur: vi.fn(),
  upsertOptions: [] as unknown[],
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 7,
  useCurrentCollectivite: () => ({ hasCollectivitePermission: () => true }),
}));
vi.mock('@tet/api/users', () => ({
  useUser: () => ({ id: 'user-1' }),
}));
vi.mock('@/app/indicateurs/indicateurs/use-update-indicateur', () => ({
  useUpdateIndicateur: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/app/indicateurs/indicateurs/use-delete-indicateur', () => ({
  useDeleteIndicateur: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/app/indicateurs/valeurs/use-declare-indicateur-periodes', () => ({
  useDeclareIndicateurPeriodes: () => vi.fn(),
}));
vi.mock('@/app/indicateurs/valeurs/use-upsert-indicateur-valeur', () => ({
  useUpsertIndicateurValeur: (options?: unknown) => {
    mocks.upsertOptions.push(options);
    return { mutateAsync: options ? mocks.upsertPeriode : mocks.upsertValeur };
  },
}));
vi.mock('../data/use-delete-indicateur-valeur', () => ({
  useDeleteIndicateurValeur: () => ({ mutateAsync: mocks.removeValeur }),
}));
vi.mock('../data/use-indicateur-chart', () => ({
  useIndicateurChartInfo: () => ({}),
}));
vi.mock('../Indicateur/useExportIndicateurs', () => ({
  useExportIndicateurs: () => ({ mutate: vi.fn() }),
}));

const indicateur = {
  id: 42,
  periodicite: 'annuelle',
} as IndicateurDetaille;

const wrapper = ({ children }: PropsWithChildren) => (
  <IndicateurDetailDataProvider indicateur={indicateur}>
    {children}
  </IndicateurDetailDataProvider>
);

describe('IndicateurDetailDataProvider : valeurs', () => {
  beforeEach(() => {
    mocks.upsertValeur.mockReset();
    mocks.upsertPeriode.mockReset();
    mocks.removeValeur.mockReset();
    mocks.upsertOptions.length = 0;
  });

  it('ajoute la collectivité et l’indicateur à la saisie d’une valeur', async () => {
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    await result.current.saveValeur({
      periodicite: 'annuelle',
      dateValeur: '2022-01-01',
      resultat: 12,
    });

    expect(mocks.upsertValeur).toHaveBeenCalledWith({
      periodicite: 'annuelle',
      dateValeur: '2022-01-01',
      resultat: 12,
      collectiviteId: 7,
      indicateurId: 42,
    });
  });

  it('déclare une période avec sa date de début, sans toast d’erreur', async () => {
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    await result.current.declarePeriode({
      periodicite: 'annuelle',
      dateDebut: '2023-01-01',
    } as Parameters<typeof result.current.declarePeriode>[0]);

    expect(mocks.upsertPeriode).toHaveBeenCalledWith({
      periodicite: 'annuelle',
      dateValeur: '2023-01-01',
      collectiviteId: 7,
      indicateurId: 42,
    });
    expect(mocks.upsertOptions).toContainEqual(
      expect.objectContaining({ disableErrorToast: true })
    );
  });

  it('supprime une valeur de l’indicateur de la collectivité courante', async () => {
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    await result.current.deleteValeur(5);

    expect(mocks.removeValeur).toHaveBeenCalledWith({
      id: 5,
      collectiviteId: 7,
      indicateurId: 42,
    });
  });
});
