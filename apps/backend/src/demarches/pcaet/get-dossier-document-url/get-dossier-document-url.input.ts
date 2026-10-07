import { z } from 'zod';
import { dossierInstructionRefSchema } from '../shared/dossier-instruction-ref.input';

export const getDossierDocumentUrlInputSchema = dossierInstructionRefSchema.and(
  z.object({ documentId: z.string().min(1) })
);

export type GetDossierDocumentUrlInput =
  typeof getDossierDocumentUrlInputSchema._output;
