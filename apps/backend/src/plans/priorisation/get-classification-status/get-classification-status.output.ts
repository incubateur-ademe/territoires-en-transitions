import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { z } from 'zod';
import {
  ClassifiedFiche,
  ClassifiedVolet,
} from '../pipeline/classify-fiches/apply-classification';
import { ClassificationLeviersJobStatusEnum } from '../models/classification-leviers-job';

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

const unclassifiedFicheSchema = z.object({
  ficheId: z.number().int().positive(),
  reason: z.string(),
});

const classificationDraftSchema = z.object({
  fiches: z.array(classifiedFicheSchema),
  unclassified: z.array(unclassifiedFicheSchema),
});

const jobIdentity = {
  id: z.string().uuid(),
  planId: z.number().int().positive(),
};

const inFlightStatusSchema = z.object({
  ...jobIdentity,
  status: z.enum([
    ClassificationLeviersJobStatusEnum.PENDING,
    ClassificationLeviersJobStatusEnum.RUNNING,
  ]),
  processedBatches: z.number().int().nonnegative(),
  totalBatches: z.number().int().nonnegative(),
});

const doneStatusSchema = z.object({
  ...jobIdentity,
  status: z.literal(ClassificationLeviersJobStatusEnum.DONE),
  draft: classificationDraftSchema,
});

const failedStatusSchema = z.object({
  ...jobIdentity,
  status: z.literal(ClassificationLeviersJobStatusEnum.FAILED),
  error: z.string(),
});

export const getClassificationStatusOutputSchema = z.discriminatedUnion(
  'status',
  [inFlightStatusSchema, doneStatusSchema, failedStatusSchema]
);

export type ClassificationStatus = z.output<
  typeof getClassificationStatusOutputSchema
>;
