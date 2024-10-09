import { z } from 'zod';

import { filtreRessourceLieesSchema } from '@tet/api/collectivites/shared/domain/filtre-ressource-liees.schema';
import { cibleSchema } from '@tet/api/plan-actions/domain';

export const filtreSpecifiqueSchema = z.object({
  cibles: cibleSchema.array().optional(),
  partenaireIds: z.number().array().optional(),
});

export type FiltreSpecifique = z.infer<typeof filtreSpecifiqueSchema>;

export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    servicePiloteIds: true,
    planActionIds: true,
  })
  .merge(filtreSpecifiqueSchema);

export type Filtre = z.infer<typeof filtreSchema>;
