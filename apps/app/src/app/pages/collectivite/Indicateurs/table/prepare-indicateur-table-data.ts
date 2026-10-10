import {
  IndicateurPeriods,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import type { PreparedData } from '../data/prepare-data';

type PreparedSource = PreparedData['sources'][number];
export type IndicateurTableSource = {
  key: string;
  source: PreparedSource;
  resultats?: PreparedSource;
  objectifs?: PreparedSource;
};

// A source version and its own periodicity identify a series, independently
// of whether it contains results, objectives, or both.
const sourceKey = (source: PreparedSource) =>
  JSON.stringify([
    source.source,
    source.periodiciteSource ?? source.valeurs[0]?.periode.periodicite,
    source.metadonnees.map(({ id }) => id).toSorted((a, b) => a - b),
  ]);

export const prepareIndicateurTableData = (
  resultats: PreparedData,
  objectifs: PreparedData,
  additionalPeriods: IndicateurPeriod[] = []
): { sources: IndicateurTableSource[]; periodes: IndicateurPeriod[] } => {
  const sources = new Map<string, IndicateurTableSource>();
  for (const [type, data] of [
    ['resultats', resultats],
    ['objectifs', objectifs],
  ] as const) {
    for (const source of data.sources) {
      const key = sourceKey(source);
      const row = sources.get(key) ?? { key, source };
      sources.set(key, { ...row, [type]: source });
    }
  }
  const periods = new Map<string, IndicateurPeriod>();
  for (const period of [
    ...resultats.periodes,
    ...objectifs.periodes,
    ...additionalPeriods,
  ]) {
    periods.set(IndicateurPeriods.key(period), period);
  }
  return {
    sources: [...sources.values()],
    periodes: [...periods.values()].sort(IndicateurPeriods.compareTotal),
  };
};
