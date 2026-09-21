import {
  categorieActionEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';

const voletSchema = z.object({
  categorie: z.enum(categorieActionEnumValues),
  note: z.number().int().min(0).max(3),
  ficheIds: z.array(z.number().int().positive()),
});

const levierSchema = z.object({
  levierId: z.enum(levierIdEnumValues),
  volets: z.array(voletSchema),
});

export const mobilisationSchema = z.object({
  collectiviteId: z.number().int().positive(),
  leviers: z.array(levierSchema),
});

export type Mobilisation = z.output<typeof mobilisationSchema>;
