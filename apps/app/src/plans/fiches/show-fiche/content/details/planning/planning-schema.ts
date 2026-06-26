import { z } from 'zod';
import type { TempsDeMiseEnOeuvre } from '@tet/domain/shared';

export const planningFormSchema = z.object({
  tempsDeMiseEnOeuvre: z.custom<TempsDeMiseEnOeuvre>().nullable(),
  ameliorationContinue: z.boolean().nullable(),
});

export type PlanningFormValues = z.infer<typeof planningFormSchema>;
