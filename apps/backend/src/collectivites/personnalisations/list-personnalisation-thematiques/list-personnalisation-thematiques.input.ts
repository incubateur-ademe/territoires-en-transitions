import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listThematiquesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionIds: z.array(z.string().min(1)).optional(),
  thematiqueIds: z.array(z.string().min(1)).optional(),
  referentielIds: z.array(referentielIdEnumSchema).optional(),
});

export type ListThematiquesInput = z.infer<typeof listThematiquesInputSchema>;
