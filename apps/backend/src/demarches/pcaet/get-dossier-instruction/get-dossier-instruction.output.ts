import {
  demarcheDocumentsSnapshotSchema,
  demarchePcaetStatusSchema,
  pcaetDemandeAvisEtatSchema,
} from '@tet/domain/demarches';
import { z } from 'zod';
import { partieValideeSchema } from '../valider-partie-instruction/valider-partie-instruction.output';

export const dossierInstructionSchema = z.object({
  demandeAvisId: z.number().int(),
  demarcheId: z.number().int(),
  titre: z.string(),
  status: demarchePcaetStatusSchema,
  etat: pcaetDemandeAvisEtatSchema,
  transmittedAt: z.string().nullable(),
  avisDeadlineAt: z.string().nullable(),
  launchedAt: z.string().nullable(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  pilotes: z.string().array(),
  collectivite: z.object({
    id: z.number().int(),
    nom: z.string(),
  }),
  documents: demarcheDocumentsSnapshotSchema,
  partiesValidees: partieValideeSchema.array(),
});

export type DossierInstruction = z.infer<typeof dossierInstructionSchema>;
