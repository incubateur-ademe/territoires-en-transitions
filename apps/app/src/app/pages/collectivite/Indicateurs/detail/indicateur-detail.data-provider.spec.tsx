import { renderHook } from '@testing-library/react';
import {
  type IndicateurDetaille,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIndicateurActions } from './indicateur-actions.context';
import { useIndicateurData } from './indicateur-data.context';
import { IndicateurDetailDataProvider } from './indicateur-detail.data-provider';

const mocks = vi.hoisted(() => ({
  upsertValeur: vi.fn(),
  upsertPeriode: vi.fn(),
  removeValeur: vi.fn(),
  updateIndicateur: vi.fn(),
  exportIndicateurs: vi.fn(),
  removeIndicateur: vi.fn(),
  hasCollectivitePermission: vi.fn(),
  exportInput: [] as unknown[],
  upsertOptions: [] as unknown[],
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => 7,
  useCurrentCollectivite: () => ({
    hasCollectivitePermission: mocks.hasCollectivitePermission,
  }),
}));
vi.mock('@tet/api/users', () => ({
  useUser: () => ({ id: 'user-1' }),
}));
vi.mock('@/app/indicateurs/indicateurs/use-update-indicateur', () => ({
  useUpdateIndicateur: () => ({ mutate: mocks.updateIndicateur }),
}));
vi.mock('@/app/indicateurs/indicateurs/use-delete-indicateur', () => ({
  useDeleteIndicateur: () => ({ mutate: mocks.removeIndicateur }),
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
  useExportIndicateurs: (input: unknown) => {
    mocks.exportInput.push(input);
    return { mutate: mocks.exportIndicateurs };
  },
}));

const indicateur = {
  id: 42,
  periodicite: 'annuelle',
  titre: 'Bornes de recharge',
  unite: 'km',
  pilotes: [],
} as unknown as IndicateurDetaille;

const wrapper = ({ children }: PropsWithChildren) => (
  <IndicateurDetailDataProvider indicateur={indicateur}>
    {children}
  </IndicateurDetailDataProvider>
);

beforeEach(() => {
  Object.values(mocks)
    .filter((mock): mock is ReturnType<typeof vi.fn> => vi.isMockFunction(mock))
    .forEach((mock) => mock.mockReset());
  mocks.exportInput.length = 0;
  mocks.upsertOptions.length = 0;
  mocks.hasCollectivitePermission.mockReturnValue(true);
});

describe('IndicateurDetailDataProvider : valeurs', () => {
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

    await result.current.declarePeriode(IndicateurPeriodes.fromYear(2023));

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

  it('laisse l’échec d’une saisie remonter à l’appelant', async () => {
    mocks.upsertValeur.mockRejectedValue(new Error('échec'));
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    await expect(
      result.current.saveValeur({
        periodicite: 'annuelle',
        dateValeur: '2022-01-01',
        resultat: 1,
      })
    ).rejects.toThrow('échec');
  });
});

describe('IndicateurDetailDataProvider : actions sur l’indicateur', () => {
  it('exporte uniquement l’indicateur courant', () => {
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    result.current.exportIndicateur();

    expect(mocks.exportInput).toContainEqual({
      mode: 'selection',
      indicateurIds: [42],
    });
    expect(mocks.exportIndicateurs).toHaveBeenCalledOnce();
  });

  it('supprime l’indicateur sans argument', () => {
    const { result } = renderHook(() => useIndicateurActions(), { wrapper });

    result.current.deleteIndicateur();

    expect(mocks.removeIndicateur).toHaveBeenCalledWith();
  });
});

describe('IndicateurDetailDataProvider : droits d’édition', () => {
  it('autorise l’édition de l’indicateur et des valeurs avec les permissions', () => {
    const { result } = renderHook(() => useIndicateurData(), { wrapper });

    expect(result.current).toMatchObject({
      canMutateIndicateur: true,
      canMutateValeur: true,
    });
  });

  it('refuse l’édition sans permission, même pour un indicateur sans pilote', () => {
    mocks.hasCollectivitePermission.mockReturnValue(false);
    const { result } = renderHook(() => useIndicateurData(), { wrapper });

    expect(result.current).toMatchObject({
      canMutateIndicateur: false,
      canMutateValeur: false,
    });
  });
});
