import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurChartProvider } from '../detail/context/indicateur-chart.context';
import type { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { CellSourceName } from './cell-source-name';

type Source = Parameters<typeof CellSourceName>[0]['source'];

const toSource = (overrides: Partial<Source>): Source =>
  ({
    source: 'snbc',
    libelle: 'SNBC',
    calculAuto: false,
    metadonnees: [],
    ...overrides,
  } as Source);

const toChartInfo = (
  overrides: Pick<IndicateurChartInfo, 'getColorBySourceId' | 'getSourceLabel'>
): IndicateurChartInfo => overrides as IndicateurChartInfo;

const renderCell = (source: Source, getSourceLabel = vi.fn()) => {
  const chartInfo = toChartInfo({
    getColorBySourceId: vi.fn(() => '#123456'),
    getSourceLabel: getSourceLabel.mockReturnValue('Libellé injecté'),
  });
  render(
    <IndicateurChartProvider value={{ chartInfo }}>
      <table>
        <tbody>
          <tr>
            <CellSourceName source={source} type="resultat" />
          </tr>
        </tbody>
      </table>
    </IndicateurChartProvider>
  );
  return chartInfo;
};

describe('CellSourceName', () => {
  it('affiche le libellé fourni par le contexte du graphique', () => {
    const getSourceLabel = vi.fn();
    renderCell(toSource({}), getSourceLabel);

    expect(screen.getByText('Libellé injecté')).toBeTruthy();
    expect(getSourceLabel).toHaveBeenCalledWith('snbc', 'SNBC', 'resultat');
  });

  it('demande la couleur de la source au contexte du graphique', () => {
    const chartInfo = renderCell(toSource({}));

    expect(chartInfo.getColorBySourceId).toHaveBeenCalledWith(
      'snbc',
      'resultat'
    );
  });

  it('n’utilise pas le libellé du contexte pour la source de la collectivité', () => {
    const getSourceLabel = vi.fn();
    renderCell(toSource({ source: 'collectivite' }), getSourceLabel);

    expect(getSourceLabel).not.toHaveBeenCalled();
  });
});
