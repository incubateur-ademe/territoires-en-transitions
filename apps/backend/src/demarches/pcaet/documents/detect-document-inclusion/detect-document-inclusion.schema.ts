import { demarcheDocumentDetectionPartieValues } from '@tet/domain/demarches';
import { z } from 'zod';

// Sans borne de longueur : un compteur dans l'automate de décodage contraint
// coûte plus cher que tout le reste du schéma. Les textes sont retaillés à
// l'écriture.
export const detectDocumentInclusionResponseSchema = z.object({
  isIncluded: z.boolean(),
  parties: z.array(z.enum(demarcheDocumentDetectionPartieValues)),
  sectionTitle: z.string(),
  pages: z.array(z.string()),
  justification: z.string(),
});

export type DetectDocumentInclusionResponse = z.output<
  typeof detectDocumentInclusionResponseSchema
>;
