import { CategorieAction, categorieActionEnumValues } from '@tet/domain/shared';

export const CATEGORIE_LABELS: Record<CategorieAction, string> = {
  amenagement: 'Aménagement & infrastructures',
  planification: 'Réglementation & planification',
  financement: 'Financement & fiscalité',
  gouvernance: 'Gouvernance & partenariats',
  exemplarite: 'Exemplarité interne',
  sensibilisation: 'Sensibilisation & accompagnement',
};

export const CATEGORIES_IN_PROMPT_ORDER = categorieActionEnumValues;

export const CATEGORIE_RANKS = {
  amenagement: '1',
  planification: '2',
  financement: '3',
  gouvernance: '4',
  exemplarite: '5',
  sensibilisation: '6',
} as const satisfies Record<CategorieAction, string>;
