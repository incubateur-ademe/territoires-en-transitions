import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';

export const MAX_JUSTIFICATION_LENGTH = 500;

// Leviers ET catégories sont désignés par leur rang, voir prompts/levier-ranks.ts.
// Mesure faite contre Gemini : garder les six slugs de catégorie en clair suffit
// à repasser au-dessus du budget d'états de son décodage contraint.
const toRankUnion = (count: number) => {
  const ranks = Array.from({ length: count }, (unused, position) =>
    z.literal(position + 1)
  );

  return z.union([ranks[0], ranks[1], ...ranks.slice(2)]);
};

const levierRankSchema = toRankUnion(levierEnumValues.length);
const categorieRankSchema = toRankUnion(categorieActionEnumValues.length);

const voletSchema = z.object({
  levier: levierRankSchema,
  // min(1) dit qu'un levier retenu porte au moins une catégorie : c'est une
  // incohérence qu'on interdit, pas une quantité qu'on plafonne. Pas de max :
  // un doublon éventuel est dédoublonné par toVolets, le rejeter ferait perdre
  // tout le lot.
  categories: z.array(categorieRankSchema).min(1),
});

const ficheClassificationSchema = z.object({
  index: z.number().int().min(0),
  // Sans borne ici : un compteur de 500 caractères dans l'automate de décodage
  // contraint coûte autant que tout le reste du schéma. La longueur est
  // retaillée par applyClassification.
  justification: z.string(),
  hasNoRelevantLevier: z.boolean(),
  // Aucun plafond sur le nombre de leviers : une fiche transversale peut en
  // toucher beaucoup, et un plafond ferait taire le modèle sans qu'il puisse le
  // signaler.
  volets: z.array(voletSchema),
});

export const classificationResponseSchema = z.array(ficheClassificationSchema);

export type ClassificationResponseSchema = typeof classificationResponseSchema;

export type FicheClassification = z.output<typeof ficheClassificationSchema>;
