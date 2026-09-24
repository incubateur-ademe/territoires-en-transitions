import { z } from 'zod';

const ficheIdSchema = z.number().int().positive();

const collectiviteIdSchema = z.number().int().positive();

const ficheFingerprintSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/)
  .brand<'FicheFingerprint'>();

export type FicheFingerprint = z.output<typeof ficheFingerprintSchema>;

export const ficheTextSchema = z.object({
  ficheId: ficheIdSchema,
  titre: z.string(),
  description: z.string().nullable(),
});

export type FicheText = z.output<typeof ficheTextSchema>;

const ficheCandidateSchema = ficheTextSchema.extend({
  collectiviteId: collectiviteIdSchema,
  modifiedAt: z.date(),
  isDeleted: z.boolean(),
});

export type FicheCandidate = z.output<typeof ficheCandidateSchema>;

const ficheAnalysisBaseSchema = ficheCandidateSchema
  .pick({ ficheId: true, collectiviteId: true })
  .extend({ analyzedAt: z.date() });

export const processedFicheAnalysisSchema = ficheAnalysisBaseSchema.extend({
  status: z.literal('processed'),
  fingerprint: ficheFingerprintSchema,
  retryCount: z.optional(z.undefined()),
});

export const staleFicheAnalysisSchema = ficheAnalysisBaseSchema.extend({
  status: z.literal('stale'),
  fingerprint: ficheFingerprintSchema.optional(),
  retryCount: z.optional(z.undefined()),
});

export const failedFicheAnalysisSchema = ficheAnalysisBaseSchema.extend({
  status: z.literal('failed'),
  fingerprint: ficheFingerprintSchema.optional(),
  retryCount: z.number().int().nonnegative(),
});

export const ficheAnalysisSchema = z.discriminatedUnion('status', [
  processedFicheAnalysisSchema,
  staleFicheAnalysisSchema,
  failedFicheAnalysisSchema,
]);

export type FicheAnalysis = z.output<typeof ficheAnalysisSchema>;

export const analysisRunPlanSchema = z.object({
  toClassify: z.array(ficheCandidateSchema),
  toMarkStale: z.array(ficheCandidateSchema),
  toRemove: z.array(ficheCandidateSchema),
});

export type AnalysisRunPlan = z.output<typeof analysisRunPlanSchema>;
