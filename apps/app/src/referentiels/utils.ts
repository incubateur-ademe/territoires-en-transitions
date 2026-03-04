import { ActionCategorie } from '@tet/domain/referentiels';
import { appLabels } from '../labels/catalog';

export const categorieToLabel: Record<ActionCategorie | string, string> = {
  bases: appLabels.phaseBases,
  'mise en œuvre': appLabels.phaseMiseEnOeuvre,
  effets: appLabels.phaseEffets,
};
