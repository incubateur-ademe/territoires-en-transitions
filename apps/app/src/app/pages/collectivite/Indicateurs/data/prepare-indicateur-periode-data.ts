import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { getAnneesDistinctes, type PreparedData } from './prepare-data';

/** Adapts the annual chart model once, before data reaches the period tables. */
export const prepareIndicateurPeriodeData = (
  data: PreparedData & { annees?: readonly number[] }
) => {
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

export type IndicateurPeriodeData = ReturnType<
  typeof prepareIndicateurPeriodeData
>;
export type IndicateurPeriodeValue =
  IndicateurPeriodeData['valeursExistantes'][number];
