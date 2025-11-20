import { bibliothequeFichierSchema } from '@tet/domain/collectivites';
import z from 'zod';

export const scoreAnalysisSchema = z.object({
  ...bibliothequeFichierSchema.shape,

  collectiviteNom: z.string().nullable(),
  auditId: z.number().nullable(),
  referentiel: z.string().nullable(),
  modifiedAt: z.string().nullable(),
  modifiedBy: z.string().nullable(),
  modifiedByName: z.string().nullable(),
  url: z.string().optional(),
  extractedScore: z.number().optional(),
  extractedScoreText: z.string().optional(),
  savedScore: z.number().optional(),
  savedScoreDate: z.string().optional(),
  snapshotScore: z.number().optional(),
  snapshotDate: z.string().optional(),
  computedScore: z.number().optional(),
  computedDate: z.string().optional(),
});

export type ScoreAnalysis = z.infer<typeof scoreAnalysisSchema>;
