import { demarchePcaetTransitionValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const applyTransitionInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  transition: z.enum(demarchePcaetTransitionValues),
});

export type ApplyTransitionInput = z.infer<typeof applyTransitionInputSchema>;
