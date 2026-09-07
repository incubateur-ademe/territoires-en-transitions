export const categorieActionEnumValues = [
  'amenagement',
  'planification',
  'financement',
  'gouvernance',
  'exemplarite',
  'sensibilisation',
] as const;

export type CategorieAction = (typeof categorieActionEnumValues)[number];
