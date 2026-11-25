import type { SousIndicateursChartState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart-state.rules';
import { appLabels } from '@/app/labels/catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { IndicateurDataProvider } from '../../context/indicateur-data.context';
import { IndicateurSousIndicateursChartProvider } from '../../context/indicateur-sous-indicateurs-chart.context';
import { IndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.view';

const PERSO = {
  id: 1,
  collectiviteId: 1,
  groupementId: null,
  identifiantReferentiel: null,
} as IndicateurDetaille;

const PREDEFINI = {
  ...PERSO,
  collectiviteId: null,
  identifiantReferentiel: 'cae_9',
} as IndicateurDetaille;

const renderChart = (
  state: SousIndicateursChartState,
  indicateur: IndicateurDetaille = PERSO
) => {
  const useSousIndicateursChart = vi.fn(() => state);
  render(
    <IndicateurDataProvider
      value={{ indicateur, canMutateIndicateur: true, canMutateValeur: true }}
    >
      <IndicateurSousIndicateursChartProvider
        value={{ useSousIndicateursChart }}
      >
        <IndicateurSousIndicateursChart
          indicateurId={1}
          unite="t"
          periodicite={IndicateurPeriodiciteEnum.ANNUELLE}
        />
      </IndicateurSousIndicateursChartProvider>
    </IndicateurDataProvider>
  );
  return useSousIndicateursChart;
};

describe('IndicateurSousIndicateursChart', () => {
  it("demande l'état du graphique pour l'indicateur affiché", () => {
    const useSousIndicateursChart = renderChart({ status: 'loading' });

    expect(useSousIndicateursChart).toHaveBeenCalledWith(1, {
      withTotals: true,
    });
  });

  it("ne demande aucun total pour un indicateur prédéfini, qui n'en a pas", () => {
    const useSousIndicateursChart = renderChart(
      { status: 'loading' },
      PREDEFINI
    );

    expect(useSousIndicateursChart).toHaveBeenCalledWith(1, {
      withTotals: false,
    });
  });

  it('annonce le chargement', () => {
    renderChart({ status: 'loading' });

    expect(screen.getByRole('status').textContent).toBe(
      appLabels.indicateurSousIndicateursChargement
    );
  });

  it("signale l'erreur de chargement", () => {
    renderChart({ status: 'error' });

    expect(screen.getByRole('alert').textContent).toBe(
      appLabels.indicateurSousIndicateursErreur
    );
  });

  it('décrit le graphique prêt par un renvoi vers le tableau', () => {
    renderChart({
      status: 'ready',
      data: {
        dates: ['2022-01-01'],
        children: [
          {
            indicateurId: 2,
            label: 'Verre',
            color: 'verre-color',
            valeurs: [3],
          },
        ],
        resultatTotal: null,
        objectifTotal: null,
      },
    });

    expect(
      screen.getByRole('img', {
        name: appLabels.indicateurSousIndicateursValeurs,
        description:
          appLabels.indicateurSousIndicateursGraphiqueAlternativeTableau,
      })
    ).toBeDefined();
  });

  it("réserve à l'état vide la hauteur du chargement, pour que le tableau ne saute pas quand le graphique apparaît", () => {
    renderChart({ status: 'loading' });
    const loadingHeight = screen.getByRole('status').style.height;
    cleanup();

    renderChart({ status: 'ready', data: null });
    const emptyContainer = screen
      .getByText(appLabels.aucuneValeurTrouvee)
      .closest('[style]') as HTMLElement;

    expect(loadingHeight).not.toBe('');
    expect(emptyContainer.style.height).toBe(loadingHeight);
  });

  it("affiche l'état vide quand il n'y a aucune valeur à tracer", () => {
    renderChart({ status: 'ready', data: null });

    expect(screen.getByText(appLabels.aucuneValeurTrouvee)).toBeDefined();
  });
});
