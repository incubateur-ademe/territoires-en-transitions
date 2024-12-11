import { z } from 'zod';

import { filtreRessourceLieesSchema } from '@/api/collectivites';
import { filtreSchema as schemaFicheAction } from '@/api/plan-actions/fiche-resumes.list';

export const filtreFromFicheActionSchema = schemaFicheAction.pick({
  cibles: true,
});

export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    servicePiloteIds: true,
    planActionIds: true,
    partenaireIds: true,
  })
  .merge(filtreFromFicheActionSchema);

export type Filtre = z.infer<typeof filtreSchema>;
