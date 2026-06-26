import { PersonneId, personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import {
  planDatesSchema,
  refinePlanDates,
} from '../upsert-plan/upsert-plan.input';
import { ImportActionOrSousAction } from './schemas/import-action.input';

export const importPlanInputSchema = z
  .object({
    collectiviteId: z.number(),
    planName: z.string(),
    planType: z.number().optional(),
    referents: z.array(personneIdSchema).optional(),
    pilotes: z.array(personneIdSchema).optional(),
    ...planDatesSchema,
    file: z.string(),
  })
  .superRefine(refinePlanDates);

export type ImportPlanInput = {
  nom: string;
  id?: number;
  actions: ImportActionOrSousAction[];
  typeId?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
  dateDebut?: string | null;
  dateFin?: string | null;
};
