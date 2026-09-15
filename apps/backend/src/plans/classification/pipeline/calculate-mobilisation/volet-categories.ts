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

export const toCategorieRank = (categorie: CategorieAction): number =>
  CATEGORIES_IN_PROMPT_ORDER.indexOf(categorie) + 1;

export const fromCategorieRank = (rank: number): CategorieAction | undefined =>
  CATEGORIES_IN_PROMPT_ORDER[rank - 1];
