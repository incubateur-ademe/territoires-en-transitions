import { z } from 'zod';
import { aiPlanImportProfileSchema } from '../models/import-profile';

export const getImportCapabilitiesOutputSchema = z.object({
  profiles: z.array(
    z.object({
      profile: aiPlanImportProfileSchema,
      available: z.boolean(),
    })
  ),
});

export type GetImportCapabilitiesOutput = z.infer<
  typeof getImportCapabilitiesOutputSchema
>;
