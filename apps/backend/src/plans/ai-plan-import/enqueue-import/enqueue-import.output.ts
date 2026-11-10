import { z } from 'zod';
import { AiPlanImportProfileEnum } from '../models/import-profile';

export const enqueueImportOutputSchema = z.discriminatedUnion('profile', [
  z.object({
    profile: z.enum([
      AiPlanImportProfileEnum.GENERIC,
      AiPlanImportProfileEnum.PCAET,
    ]),
    jobId: z.string().uuid(),
    planId: z.number().int().positive(),
  }),
  z.object({
    profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
    jobId: z.string().uuid(),
    planId: z.null(),
  }),
]);

export type EnqueueImportOutput = z.infer<typeof enqueueImportOutputSchema>;
