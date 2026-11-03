import type { IndicateurCommon } from '@tet/domain/indicateurs';
import { AxeLight } from '@tet/domain/plans';

export type AxeIndicateur = Pick<IndicateurCommon, 'id' | 'titre' | 'unite'>;

export type GetAxeOutput = AxeLight & {
  indicateurs: AxeIndicateur[];
  chemin: AxeLight[];
};
