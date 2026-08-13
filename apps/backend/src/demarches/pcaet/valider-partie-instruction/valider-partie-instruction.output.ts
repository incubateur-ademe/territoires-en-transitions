import { pcaetInstructionPartieSchema } from '@tet/domain/demarches';
import { z } from 'zod';

export const partieValideeSchema = z.object({
  partie: pcaetInstructionPartieSchema,
  valideLe: z.string(),
  validePar: z.string().nullable(),
});

export type PartieValidee = z.infer<typeof partieValideeSchema>;
