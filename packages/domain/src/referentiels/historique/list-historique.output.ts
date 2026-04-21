import z from 'zod';
import { historiqueItemSchema } from './historique-item.schema';

export const listHistoriqueOutputSchema = z.object({
  items: historiqueItemSchema.array(),
  total: z.number(),
});

export type ListHistoriqueOutput = z.infer<typeof listHistoriqueOutputSchema>;
