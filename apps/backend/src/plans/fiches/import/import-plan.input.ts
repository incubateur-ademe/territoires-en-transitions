import { PersonneId, personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import { FicheImport } from './schemas/fiche-import.schema';

export const importPlanInputSchema = z.object({
  collectiviteId: z.number(),
  planName: z.string(),
  planType: z.number().optional(),
  referents: z.array(personneIdSchema).optional(),
  pilotes: z.array(personneIdSchema).optional(),
  file: z.string(),
});

export type PlanImport = {
  nom: string;
  id?: number;
  fiches: FicheImport[];
  typeId?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
};
