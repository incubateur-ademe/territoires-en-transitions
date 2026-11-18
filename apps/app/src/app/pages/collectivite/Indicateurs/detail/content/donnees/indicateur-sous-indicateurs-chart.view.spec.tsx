import type { SousIndicateursChartState } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart-state.rules';
import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurSousIndicateursChartProvider } from '../../context/indicateur-sous-indicateurs-chart.context';
import { IndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.view';

const renderChart = (state: SousIndicateursChartState) => {
  const useSousIndicateursChart = vi.fn(() => state);
  render(
    <IndicateurSousIndicateursChartProvider value={{ useSousIndicateursChart }}>
      <IndicateurSousIndicateursChart
        indicateurId={1}
        unite="t"
        periodicite={IndicateurPeriodiciteEnum.ANNUELLE}
      />
    </IndicateurSousIndicateursChartProvider>
  );
  return useSousIndicateursChart;
};

describe('IndicateurSousIndicateursChart', () => {
  it("demande l'état du graphique pour l'indicateur affiché", () => {
    const useSousIndicateursChart = renderChart({ status: 'loading' });

    expect(useSousIndicateursChart).toHaveBeenCalledWith(1);
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

  it("affiche l'état vide quand il n'y a aucune valeur à tracer", () => {
    renderChart({ status: 'ready', data: null });

    expect(screen.getByText(appLabels.aucuneValeurTrouvee)).toBeDefined();
  });
});
