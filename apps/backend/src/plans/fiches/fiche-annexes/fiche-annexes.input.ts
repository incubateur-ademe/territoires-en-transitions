import { z } from 'zod';

export const ficheAnnexesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  ficheIds: z.number().int().positive().array(),
});

export type FicheAnnexesInput = z.infer<typeof ficheAnnexesInputSchema>;
