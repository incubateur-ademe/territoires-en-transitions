import * as z from 'zod/mini';

export const ActionCategorieEnum = {
  BASES: 'bases',
  MISE_EN_OEUVRE: 'mise en œuvre',
  EFFETS: 'effets',
} as const;

export const actionCategorieEnumSchema = z.enum([
  ActionCategorieEnum.BASES,
  ActionCategorieEnum.MISE_EN_OEUVRE,
  ActionCategorieEnum.EFFETS,
]);

export type ActionCategorie = z.infer<typeof actionCategorieEnumSchema>;
