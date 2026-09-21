import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';

export const MAX_JUSTIFICATION_LENGTH = 500;

// Leviers ET categories sont designes par leur rang, voir prompts/levier-ranks.ts.
// Mesure faite contre Gemini : garder les six slugs de categorie en clair suffit
// a repasser au-dessus du budget d'etats de son decodage contraint.
const toRankUnion = (count: number) =>
  z.union(
    Array.from({ length: count }, (unused, position) =>
      z.literal(position + 1)
    ) as unknown as [z.ZodLiteral<number>, z.ZodLiteral<number>]
  );

const levierRankSchema = toRankUnion(levierEnumValues.length);
const categorieRankSchema = toRankUnion(categorieActionEnumValues.length);

const voletSchema = z.object({
  levier: levierRankSchema,
  // min(1) dit qu'un levier retenu porte au moins une categorie : c'est une
  // incoherence qu'on interdit, pas une quantite qu'on plafonne. Pas de max :
  // un doublon eventuel est dedoublonne par toVolets, le rejeter ferait perdre
  // tout le lot.
  categories: z.array(categorieRankSchema).min(1),
});

const ficheClassificationSchema = z.object({
  index: z.number().int().min(0),
  // Sans borne ici : un compteur de 500 caracteres dans l'automate de decodage
  // contraint coute autant que tout le reste du schema. La longueur est
  // demandee dans le prompt et retaillee par applyClassification.
  justification: z.string(),
  hasNoRelevantLevier: z.boolean(),
  // Aucun plafond sur le nombre de leviers : une fiche transversale peut en
  // toucher beaucoup, et un plafond ferait taire le modele sans qu'il puisse le
  // signaler. La borne restante dit seulement qu'un levier retenu a au moins une
  // categorie, ce qui est une incoherence, pas une quantite.
  volets: z.array(voletSchema),
});

export const classificationResponseSchema = z.array(ficheClassificationSchema);

export type ClassificationResponseSchema = typeof classificationResponseSchema;

export type FicheClassification = z.output<typeof ficheClassificationSchema>;
