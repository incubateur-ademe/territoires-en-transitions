import { levierIdEnumValues } from '@tet/domain/shared';
import { z } from 'zod';

export const MAX_LEVIERS_PER_FICHE = 3;

export const categorieRanks = [1, 2, 3, 4, 5, 6] as const;

const voletSchema = z.object({
  levier: z.enum(levierIdEnumValues),
  categories: z.array(z.literal(categorieRanks)).min(1),
});

export const ficheClassificationSchema = z.object({
  leviers: z.array(voletSchema),
});

export type FicheClassification = z.output<typeof ficheClassificationSchema>;
