import { PersonneId, personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import { ImportFicheInput } from './schemas/import-fiche.input';

export const importPlanInputSchema = z.object({
  collectiviteId: z.number(),
  planName: z.string(),
  planType: z.number().optional(),
  referents: z.array(personneIdSchema).optional(),
  pilotes: z.array(personneIdSchema).optional(),
  file: z.string(),
});

export type ImportPlanInput = {
  nom: string;
  id?: number;
  fiches: ImportFicheInput[];
  typeId?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
};
