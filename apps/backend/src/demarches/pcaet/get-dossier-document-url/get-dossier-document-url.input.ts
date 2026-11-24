import { z } from 'zod';
import { dossierInstructionRefSchema } from '../shared/dossier-instruction-ref.input';

export const getDossierDocumentUrlInputSchema = dossierInstructionRefSchema.and(
  z.union([
    z.object({
      documentId: z.string().min(1),
      documentAdditionalId: z.never().optional(),
    }),
    z.object({
      documentId: z.never().optional(),
      documentAdditionalId: z.number().int().positive(),
    }),
  ])
);

export type GetDossierDocumentUrlInput =
  typeof getDossierDocumentUrlInputSchema._output;
