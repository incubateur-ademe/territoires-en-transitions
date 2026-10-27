import { z } from 'zod';

export const listDatesSaisineInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
});

export type ListDatesSaisineInput = z.infer<typeof listDatesSaisineInputSchema>;
