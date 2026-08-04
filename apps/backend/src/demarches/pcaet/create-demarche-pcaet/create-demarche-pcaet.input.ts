import { personneIdSchema } from '@tet/domain/collectivites';
import { demarchePcaetObligationValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const createDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  titre: z.string().optional(),
  description: z.string().optional(),
  obligation: z.enum(demarchePcaetObligationValues).optional(),
  launchedAt: z.iso.datetime({ offset: true }).nullish(),
  pilotes: z.array(personneIdSchema).optional(),
});

export type CreateDemarchePcaetInput = z.infer<
  typeof createDemarchePcaetInputSchema
>;
