import z from 'zod';
import { generateReportInputSchema } from './generate-report.input';
import { reportGenerationStatusValues } from './report-generation-status.enum';
// ReportGenerationOptions is Omit<ReportGenerationInput, 'planId' | 'templateKey'>
export const reportGenerationOptionsSchema = generateReportInputSchema.omit({
  planId: true,
  templateKey: true,
});

export type ReportGenerationOptions = z.infer<
  typeof reportGenerationOptionsSchema
>;

export const reportGenerationSchema = z.object({
  id: z.uuid(),
  collectiviteId: z.number(),
  planId: z.number(),
  name: z.string(),
  templateRef: z.string(),
  fileId: z.number().nullable(),
  options: reportGenerationOptionsSchema.nullable(),
  status: z.enum(reportGenerationStatusValues),
  errorMessage: z.string().nullable(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type ReportGeneration = z.infer<typeof reportGenerationSchema>;
