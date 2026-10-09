import { planStatusValues } from '@tet/domain/plans';
import { z } from 'zod';

export const findPreviousImportOutputSchema = z
  .object({
    planId: z.number().int(),
    planNom: z.string().nullable(),
    planStatus: z.enum(planStatusValues),
    importedAt: z.string(),
  })
  .nullable();
