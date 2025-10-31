import { SourceType } from './types';

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  objectif: 'objectifs',
  resultat: 'résultats',
};

export const getSourceTypeLabel = (sourceType: SourceType | null) =>
  (sourceType && SOURCE_TYPE_LABEL[sourceType]) || null;

export const SOURCE_COLLECTIVITE = '$sc';

export const INDICATEUR_LABELS = {
  personalized: {
    singular: 'Indicateur personnalisé',
    plural: 'Indicateurs personnalisés',
  },
  favorites: {
    singular: 'Indicateur favori',
    plural: 'Indicateurs favoris',
    tooltip: 'Indicateurs favoris de la collectivité',
  },
  keys: {
    singular: 'Indicateur clé',
    plural: 'Indicateurs clés',
  },
  private: {
    singular: 'Indicateur privé',
    plural: 'Indicateurs privés',
  },
  myIndicateurs: {
    singular: 'Mon indicateur',
    plural: 'Mes indicateurs',
    tooltip: 'Indicateurs dont je suis la personne pilote',
  },
  all: {
    singular: 'Indicateur',
    plural: 'Tous les indicateurs',
  },
} as const;
