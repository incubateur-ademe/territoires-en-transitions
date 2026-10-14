import {
  type IndicateurAvecValeursParSource,
  ORDERED_SEGMENTATIONS,
} from '@tet/domain/indicateurs';
import type { DatasetComponentOption, LineSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';
import { IndicateurChartBuilder } from './indicateur-chart.builder';

const indicateur = (
  id: number,
  valeurs: { dateValeur: string; resultat: number; metadonneeId: number }[]
) =>
  ({
    definition: {
      id,
      titre: `Indicateur ${id}`,
      unite: 'kg',
      periodicite: 'annuelle',
    },
    sources: {
      citepa: {
        source: 'citepa',
        libelle: 'CITEPA',
        metadonnees: [
          { id: 11, sourceId: 'citepa', dateVersion: '2025-01-01' },
          { id: 12, sourceId: 'citepa', dateVersion: '2026-01-01' },
        ],
        valeurs: valeurs.map((valeur) => ({
          ...valeur,
          periodicite: 'annuelle',
        })),
      },
    },
  } as unknown as IndicateurAvecValeursParSource);

describe('annual chart source versions', () => {
  it('aligns segment gaps within each source version and preserves zero and isolated points', () => {
    const chart = new IndicateurChartBuilder().build({
      indicateurValeurs: indicateur(1, []),
      segmentation: {
        type: ORDERED_SEGMENTATIONS[0],
        source: 'citepa',
        valeurType: 'resultat',
        indicateursEnfantValeurs: [
          indicateur(2, [
            { dateValeur: '2024-01-01', resultat: 0, metadonneeId: 11 },
            { dateValeur: '2026-01-01', resultat: 3, metadonneeId: 11 },
            { dateValeur: '2024-01-01', resultat: 100, metadonneeId: 12 },
          ]),
          indicateur(3, [
            { dateValeur: '2025-01-01', resultat: 2, metadonneeId: 11 },
            { dateValeur: '2027-01-01', resultat: 200, metadonneeId: 12 },
          ]),
        ],
      },
    });
    const datasets = chart.dataset as DatasetComponentOption[];
    const first = datasets.find(
      ({ id }) => id === '2-resultat-citepa-annuelle-11'
    );
    const second = datasets.find(
      ({ id }) => id === '2-resultat-citepa-annuelle-12'
    );
    expect(first?.source).toEqual([
      { dateValeur: '2024-01-01', valeur: 0 },
      { dateValeur: '2025-01-01', valeur: null },
      { dateValeur: '2026-01-01', valeur: 3 },
    ]);
    expect(second?.source).toEqual([
      { dateValeur: '2024-01-01', valeur: 100 },
      { dateValeur: '2027-01-01', valeur: null },
    ]);
    const series = chart.series as LineSeriesOption[];
    const firstSeries = series.find(({ datasetId }) => datasetId === first?.id);
    const secondSeries = series.find(
      ({ datasetId }) => datasetId === second?.id
    );
    expect(firstSeries?.stack).toBe('citepa:annuelle:11');
    expect(secondSeries?.stack).toBe('citepa:annuelle:12');
    expect(firstSeries?.connectNulls).toBe(false);
    const symbol = firstSeries?.symbol as (
      value: unknown,
      params: { dataIndex: number }
    ) => string;
    expect(symbol(null, { dataIndex: 0 })).toBe('circle');
  });
});
