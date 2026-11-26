import { planStatusValues } from '@tet/domain/plans';
import { z } from 'zod';
import { importAbandonSchema } from '../models/import-report';

export const findPreviousImportOutputSchema = z
  .object({
    planId: z.number().int(),
    planNom: z.string().nullable(),
    planStatus: z.enum(planStatusValues),
    importedAt: z.string(),
  })
  .nullable();

export const findAbandonedImportOutputSchema = z
  .object({
    jobId: z.string().uuid(),
    importedAt: z.string(),
    abandon: importAbandonSchema,
  })
  .nullable();
