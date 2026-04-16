import { appLabels } from '@/app/labels/catalog';
import { SourceType } from './types';

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  objectif: appLabels.sourceTypeObjectif,
  resultat: appLabels.sourceTypeResultat,
};

export const getSourceTypeLabel = (sourceType: SourceType | null) =>
  (sourceType && SOURCE_TYPE_LABEL[sourceType]) || null;

export const SOURCE_COLLECTIVITE = '$sc';

export const INDICATEUR_LABELS = {
  personalized: {
    singular: appLabels.indicateurPersonnaliseSingulier,
    plural: appLabels.indicateurPersonnalisePluriel,
  },
  favorites: {
    singular: appLabels.indicateurFavoriSingulier,
    plural: appLabels.indicateurFavoriPluriel,
    tooltip: appLabels.indicateurFavoriTooltip,
  },
  keys: {
    singular: appLabels.indicateurCleSingulier,
    plural: appLabels.indicateurClePluriel,
  },
  private: {
    singular: appLabels.indicateurPriveSingulier,
    plural: appLabels.indicateurPrivePluriel,
  },
  myIndicateurs: {
    singular: appLabels.indicateurMonSingulier,
    plural: appLabels.indicateurMonPluriel,
    tooltip: appLabels.indicateurMonTooltip,
  },
  all: {
    singular: appLabels.indicateurTousSingulier,
    plural: appLabels.indicateurTousPluriel,
  },
} as const;
