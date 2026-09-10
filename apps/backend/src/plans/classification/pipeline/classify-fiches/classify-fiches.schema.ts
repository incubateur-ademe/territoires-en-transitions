import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';

export const MAX_JUSTIFICATION_LENGTH = 500;
export const MAX_VOLETS_PER_FICHE = 10;

const voletSchema = z.object({
  levier: z.enum(levierEnumValues),
  categories: z
    .array(z.enum(categorieActionEnumValues))
    .min(1)
    .max(categorieActionEnumValues.length),
});

const ficheClassificationSchema = z.object({
  index: z.number().int().min(0),
  justification: z.string().trim().min(1).max(MAX_JUSTIFICATION_LENGTH),
  hasNoRelevantLevier: z.boolean(),
  volets: z.array(voletSchema).max(MAX_VOLETS_PER_FICHE),
});

export const classificationResponseSchema = z.array(ficheClassificationSchema);

export type ClassificationResponseSchema = typeof classificationResponseSchema;

export type FicheClassification = z.output<typeof ficheClassificationSchema>;
