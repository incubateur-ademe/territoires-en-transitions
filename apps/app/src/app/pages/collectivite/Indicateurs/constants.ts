import { appLabels } from '@/app/labels/catalog';
import { SourceType } from './types';

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  objectif: appLabels.indicateurObjectif({ plural: true }),
  resultat: appLabels.indicateurResultat({ plural: true }),
};
