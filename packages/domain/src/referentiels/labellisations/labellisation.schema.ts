import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiel-id.enum';

export const labellisationSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentiel: referentielIdEnumSchema,
  obtenueLe: z.iso.datetime(),
  annee: z.number(),
  etoiles: z.number(),
  scoreRealise: z.nullable(z.number()),
  scoreProgramme: z.nullable(z.number()),
});

export type Labellisation = z.infer<typeof labellisationSchema>;
