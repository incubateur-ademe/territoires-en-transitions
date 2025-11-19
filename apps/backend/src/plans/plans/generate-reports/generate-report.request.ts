import z from 'zod';
import { ReportTemplates } from './report-templates.enum';

export const reportGenerationRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
  templateKey: z.enum(ReportTemplates).default('general_bilan_template'),
});

export type ReportGenerationRequest = z.infer<
  typeof reportGenerationRequestSchema
>;
