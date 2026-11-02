import { z } from 'zod';

export const addDateSaisineInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  dateSaisine: z.iso.date(),
});

export type AddDateSaisineInput = z.infer<typeof addDateSaisineInputSchema>;
