import {
  IndicateurPeriodes,
  type IndicateurPeriodeAnnuelle,
} from '@tet/domain/indicateurs';
import { getAnneesDistinctes, type PreparedData } from './prepare-data';

type PreparedSource = PreparedData['sources'][number];
type IndicateurPeriodeSource = Omit<PreparedSource, 'valeurs'> & {
  valeurs: (Omit<PreparedSource['valeurs'][number], 'annee' | 'anneeISO'> & {
    periode: IndicateurPeriodeAnnuelle;
  })[];
};

export type IndicateurPeriodeValue = Omit<
  PreparedData['valeursExistantes'][number],
  'annee'
> & { periode: IndicateurPeriodeAnnuelle };

export type IndicateurPeriodeData = {
  indicateurId: PreparedData['indicateurId'];
  periodes: IndicateurPeriodeAnnuelle[];
  periodeModePrive: IndicateurPeriodeAnnuelle | undefined;
  sources: IndicateurPeriodeSource[];
  donneesCollectivite: IndicateurPeriodeSource | undefined;
  valeursExistantes: IndicateurPeriodeValue[];
};

/** Adapts the annual chart model once, before data reaches the period tables. */
export const prepareIndicateurPeriodeData = (
  data: PreparedData & { annees?: readonly number[] }
): IndicateurPeriodeData => {
  const sources = data.sources.map((source) => ({
    ...source,
    valeurs: source.valeurs.map(({ annee, anneeISO, ...value }) => ({
      ...value,
      periode: IndicateurPeriodes.fromYear(annee),
    })),
  }));
  return {
    indicateurId: data.indicateurId,
    periodes: IndicateurPeriodes.merge(
      (data.annees ?? getAnneesDistinctes(data)).map(
        IndicateurPeriodes.fromYear
      )
    ),
    periodeModePrive:
      data.anneeModePrive === undefined
        ? undefined
        : IndicateurPeriodes.fromYear(data.anneeModePrive),
    sources,
    donneesCollectivite: sources.find(
      (source) => source.source === 'collectivite'
    ),
    valeursExistantes: data.valeursExistantes.map(({ annee, ...value }) => ({
      ...value,
      periode: IndicateurPeriodes.fromYear(annee),
    })),
  };
};
