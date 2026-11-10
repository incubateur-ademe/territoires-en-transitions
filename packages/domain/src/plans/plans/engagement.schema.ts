import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

/** Cible d'un engagement ; null représente une valeur non renseignée. */
export const engagementCibleSchema = z.strictObject({
  key: nonBlankTextSchema,
  valeur: z.nullable(z.number()),
  unite: z.nullable(nonBlankTextSchema),
  annee: z.nullable(z.int()),
});

/** Engagement d'un plan ; son code est défini par le programme concerné. */
export const engagementSchema = z.strictObject({
  code: nonBlankTextSchema,
  cibles: z.array(engagementCibleSchema),
});

export type EngagementCible = z.infer<typeof engagementCibleSchema>;
export type Engagement = z.infer<typeof engagementSchema>;
