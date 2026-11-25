import type { SousIndicateursChartState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart-state.rules';
import { appLabels } from '@/app/labels/catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurSousIndicateursChartProvider } from '../context/indicateur-sous-indicateurs-chart.context';
import { IndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.view';

const renderChart = (state: SousIndicateursChartState) => {
  const useSousIndicateursChart = vi.fn(() => state);
  render(
    <IndicateurSousIndicateursChartProvider value={{ useSousIndicateursChart }}>
      <IndicateurSousIndicateursChart
        indicateurId={1}
        isCumul={false}
        unite="t"
        periodicite={IndicateurPeriodiciteEnum.ANNUELLE}
      />
    </IndicateurSousIndicateursChartProvider>
  );
  return useSousIndicateursChart;
};

describe('IndicateurSousIndicateursChart', () => {
  it("demande l'état du graphique pour l'indicateur affiché et son réglage de cumul", () => {
    const useSousIndicateursChart = renderChart({ status: 'loading' });

    expect(useSousIndicateursChart).toHaveBeenCalledWith(1, false);
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
        mode: 'lines',
        dates: ['2022-01-01'],
        lines: [
          {
            indicateurId: 2,
            label: 'Verre',
            color: 'verre-color',
            resultatValeurs: [3],
            objectifValeurs: null,
          },
        ],
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
