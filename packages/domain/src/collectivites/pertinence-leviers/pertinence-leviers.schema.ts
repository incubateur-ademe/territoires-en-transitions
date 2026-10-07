import * as z from 'zod/mini';
import { categorieActionEnumValues, levierIdEnumValues } from '../../shared';
import { pertinenceEnumValues } from './pertinence.enum';

export const pertinenceLevierSchema = z.object({
  levierId: z.enum(levierIdEnumValues),
  categorie: z.optional(z.enum(categorieActionEnumValues)),
  pertinence: z.enum(pertinenceEnumValues),
});

export type PertinenceLevier = z.infer<typeof pertinenceLevierSchema>;
