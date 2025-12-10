import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { AxeLight } from '@tet/domain/plans';

export type Indicateur = Pick<IndicateurDefinition, 'id' | 'titre' | 'unite'>;

export type GetAxeOutput = AxeLight & {
  indicateurs: Indicateur[];
};
