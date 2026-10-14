import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import type { PreparedData } from './prepare-data';

type PreparedSource = PreparedData['sources'][number];
type IndicateurPeriodeSource = PreparedSource;

export type IndicateurPeriodeValue = PreparedData['valeursExistantes'][number];

export type IndicateurPeriodeData = {
  indicateurId: PreparedData['indicateurId'];
  periodes: IndicateurPeriode[];
  periodeModePrive: IndicateurPeriode | undefined;
  sources: IndicateurPeriodeSource[];
  donneesCollectivite: IndicateurPeriodeSource | undefined;
  valeursExistantes: IndicateurPeriodeValue[];
};

/** Shares the prepared periods with the combined results/objectives table. */
export const prepareIndicateurPeriodeData = (
  data: PreparedData
): IndicateurPeriodeData => {
  return {
    indicateurId: data.indicateurId,
    periodes: IndicateurPeriodes.merge(data.periodes),
    periodeModePrive: data.dernierePeriodeModePrive,
    sources: data.sources,
    donneesCollectivite: data.donneesCollectivite,
    valeursExistantes: data.valeursExistantes,
  };
};
