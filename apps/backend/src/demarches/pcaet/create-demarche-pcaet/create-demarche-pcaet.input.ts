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
  /**
   * Le PCAET a déjà été transmis pour avis hors de la plateforme : la démarche
   * démarre alors à l'étape de finalisation, sans circuit d'avis. Choix figé —
   * aucune route ne le modifie ensuite.
   */
  transmittedOffPlatform: z.boolean().optional(),
});

export type CreateDemarchePcaetInput = z.infer<
  typeof createDemarchePcaetInputSchema
>;
