import {
  categorieActionEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';

const ficheCountSchema = z.number().int().min(0);

const voletSchema = z.object({
  categorie: z.enum(categorieActionEnumValues),
  note: z.number().int().min(0).max(3),
  ficheCount: ficheCountSchema,
});

const levierSchema = z.object({
  levierId: z.enum(levierIdEnumValues),
  ficheCount: ficheCountSchema,
  volets: z.array(voletSchema),
});

export const mobilisationSchema = z.object({
  collectiviteId: z.number().int().positive(),
  leviers: z.array(levierSchema),
});

export type LevierMobilisationOutput = z.output<typeof levierSchema>;

export type Mobilisation = z.output<typeof mobilisationSchema>;
