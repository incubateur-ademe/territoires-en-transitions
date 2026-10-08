import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { IndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';

type PreparedSource = IndicateurPeriodeData['sources'][number];
export type IndicateurTableSource = {
  key: string;
  source: PreparedSource;
  resultats?: PreparedSource;
  objectifs?: PreparedSource;
};

// Results and objectives share a row only when their source versions match.
const sourceKey = (source: PreparedSource) =>
  JSON.stringify([
    source.source,
    source.metadonnees.map(({ id }) => id).toSorted((a, b) => a - b),
  ]);

export const prepareIndicateurTableData = (
  resultats: IndicateurPeriodeData,
  objectifs: IndicateurPeriodeData,
  additionalPeriodes: readonly IndicateurPeriode[] = []
): { sources: IndicateurTableSource[]; periodes: IndicateurPeriode[] } => {
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
  return {
    sources: [...sources.values()],
    periodes: IndicateurPeriodes.merge(
      resultats.periodes,
      objectifs.periodes,
      additionalPeriodes
    ),
  };
};
