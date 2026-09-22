import {
  categorieActionEnumValues,
  enjeuEnumValues,
  analysisStepEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';
import {
  ClassifiedFiche,
  ClassifiedVolet,
} from '../pipeline/classify-fiches/apply-classification';
import { AnalysisJobStatusEnum } from '../models/analysis-job';

const classifiedVoletSchema = z.object({
  levier: z.enum(levierEnumValues),
  categorie: z.enum(categorieActionEnumValues),
}) satisfies z.ZodType<ClassifiedVolet>;

const classifiedFicheSchema = z.object({
  ficheId: z.number().int().positive(),
  justification: z.string(),
  isDescriptionTruncated: z.boolean(),
  volets: z.array(classifiedVoletSchema),
}) satisfies z.ZodType<ClassifiedFiche>;

const classificationReportSchema = z.object({
  fiches: z.array(classifiedFicheSchema),
});

const jobIdentity = {
  id: z.string().uuid(),
  collectiviteId: z.number().int().positive(),
  enjeu: z.enum(enjeuEnumValues),
  etape: z.enum(analysisStepEnumValues),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
};

const inFlightStatusSchema = z.object({
  ...jobIdentity,
  status: z.enum([
    AnalysisJobStatusEnum.PENDING,
    AnalysisJobStatusEnum.RUNNING,
  ]),
  processedBatches: z.number().int().nonnegative(),
  totalBatches: z.number().int().nonnegative(),
});

const doneStatusSchema = z.object({
  ...jobIdentity,
  etape: z.literal('mobilisation'),
  status: z.literal(AnalysisJobStatusEnum.DONE),
  report: classificationReportSchema,
});

const failedStatusSchema = z.object({
  ...jobIdentity,
  status: z.literal(AnalysisJobStatusEnum.FAILED),
  error: z.string(),
});

export const analysisStatusSchema = z.discriminatedUnion('status', [
  inFlightStatusSchema,
  doneStatusSchema,
  failedStatusSchema,
]);

export const getLastAnalysisOutputSchema = analysisStatusSchema.nullable();

export type AnalysisStatus = z.output<typeof analysisStatusSchema>;
