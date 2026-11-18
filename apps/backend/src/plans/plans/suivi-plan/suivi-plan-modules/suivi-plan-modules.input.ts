import { z } from 'zod';

export const listSuiviPlanModulesInputSchema = z.object({
  planId: z.number().int().positive(),
});

export const deleteSuiviPlanModuleInputSchema = z.object({
  planId: z.number().int().positive(),
  moduleId: z.uuid(),
});
