import { indicateurDetailleSchema } from '@tet/domain/indicateurs';
import z from 'zod';

export const listIndicateursOutputSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: z.array(indicateurDetailleSchema),
});

export type ListIndicateursOutput = z.infer<typeof listIndicateursOutputSchema>;
