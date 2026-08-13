import { pcaetInstructionPartieValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const validerPartieInstructionInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  partie: z.enum(pcaetInstructionPartieValues),
  validee: z.boolean(),
});

export type ValiderPartieInstructionInput = z.infer<
  typeof validerPartieInstructionInputSchema
>;
