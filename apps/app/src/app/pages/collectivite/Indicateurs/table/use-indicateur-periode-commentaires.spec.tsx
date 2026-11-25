import { renderHook } from '@testing-library/react';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  type IndicateurDetaille,
} from '@tet/domain/indicateurs';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  IndicateurActionsProvider,
  type IndicateurActionsValue,
} from '../detail/context/indicateur-actions.context';
import {
  IndicateurChartProvider,
  type IndicateurChartValue,
} from '../detail/context/indicateur-chart.context';
import { IndicateurDataProvider } from '../detail/context/indicateur-data.context';
import { toIndicateurActions } from './to-indicateur-actions.fixture';
import { useIndicateurPeriodeCommentaires } from './use-indicateur-periode-commentaires';

const PERIODE_2021 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2021'
);
const PERIODE_2022 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2022'
);
const JANVIER_2022 = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.MENSUELLE,
  '2022-01'
);

const toChart = ({
  isLoading = false,
}: { isLoading?: boolean } = {}): IndicateurChartValue =>
  ({
    chartInfo: {
      isLoading,
      data: {
        valeurs: {
          resultats: {
            valeursExistantes: [
              {
                id: 7,
                periode: PERIODE_2022,
                resultatCommentaire: 'Mesuré en mars',
                objectifCommentaire: null,
              },
            ],
          },
        },
      },
    },
  } as unknown as IndicateurChartValue);

const renderCommentaires = ({
  isLoading,
  actions = toIndicateurActions(),
}: {
  isLoading?: boolean;
  actions?: IndicateurActionsValue;
} = {}) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <IndicateurDataProvider
      value={{
        indicateur: {
          id: 1,
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        } as IndicateurDetaille,
        canMutateIndicateur: true,
        canMutateValeur: true,
      }}
    >
      <IndicateurChartProvider value={toChart({ isLoading })}>
        <IndicateurActionsProvider value={actions}>
          {children}
        </IndicateurActionsProvider>
      </IndicateurChartProvider>
    </IndicateurDataProvider>
  );
  return renderHook(() => useIndicateurPeriodeCommentaires(), { wrapper });
};

describe('useIndicateurPeriodeCommentaires', () => {
  it("donne les commentaires de la valeur existante de l'indicateur pour la période", () => {
    const { result } = renderCommentaires();

    expect(result.current.commentairesOf(PERIODE_2022)).toEqual({
      resultat: 'Mesuré en mars',
      objectif: '',
    });
  });

  it('ne donne aucun commentaire pour une période sans valeur', () => {
    const { result } = renderCommentaires();

    expect(result.current.commentairesOf(PERIODE_2021)).toEqual({
      resultat: '',
      objectif: '',
    });
  });

  it("enregistre les commentaires sur l'indicateur avec l'identité de la valeur existante", async () => {
    const actions = toIndicateurActions();
    const { result } = renderCommentaires({ actions });

    const isSaved = await result.current.save({
      periode: PERIODE_2022,
      commentaires: { resultat: 'Corrigé', objectif: 'Cible' },
    });

    expect(isSaved).toBe(true);
    expect(actions.saveValeur).toHaveBeenCalledWith({
      id: 7,
      dateValeur: PERIODE_2022.dateDebut,
      periodicite: PERIODE_2022.periodicite,
      resultatCommentaire: 'Corrigé',
      objectifCommentaire: 'Cible',
    });
  });

  it("crée la valeur quand la période n'en a pas encore", async () => {
    const actions = toIndicateurActions();
    const { result } = renderCommentaires({ actions });

    await result.current.save({
      periode: PERIODE_2021,
      commentaires: { resultat: 'Premier commentaire', objectif: '' },
    });

    expect(actions.saveValeur).toHaveBeenCalledWith({
      id: undefined,
      dateValeur: PERIODE_2021.dateDebut,
      periodicite: PERIODE_2021.periodicite,
      resultatCommentaire: 'Premier commentaire',
      objectifCommentaire: '',
    });
  });

  it("indique l'échec quand l'enregistrement est refusé", async () => {
    const actions = toIndicateurActions({
      saveValeur: vi.fn().mockRejectedValue(new Error('refusé')),
    });
    const { result } = renderCommentaires({ actions });

    await expect(
      result.current.save({
        periode: PERIODE_2022,
        commentaires: { resultat: 'a', objectif: 'b' },
      })
    ).resolves.toBe(false);
  });

  it("refuse une période qui n'a pas la périodicité de l'indicateur, sans rien enregistrer", async () => {
    const actions = toIndicateurActions();
    const { result } = renderCommentaires({ actions });

    const isSaved = await result.current.save({
      periode: JANVIER_2022,
      commentaires: { resultat: 'a', objectif: 'b' },
    });

    expect(isSaved).toBe(false);
    expect(actions.saveValeur).not.toHaveBeenCalled();
  });

  it("n'est pas prêt tant que les valeurs de l'indicateur se chargent", () => {
    expect(renderCommentaires({ isLoading: true }).result.current.isReady).toBe(
      false
    );
    expect(
      renderCommentaires({ isLoading: false }).result.current.isReady
    ).toBe(true);
  });
});
