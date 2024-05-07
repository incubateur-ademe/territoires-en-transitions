import {SourceType} from './types';

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  objectif: 'objectifs',
  resultat: 'résultats',
};

export const getSourceTypeLabel = (sourceType: SourceType | null) =>
  (sourceType && SOURCE_TYPE_LABEL[sourceType]) || null;

export const SOURCE_COLLECTIVITE = '$sc';
