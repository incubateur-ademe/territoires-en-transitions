import z from 'zod';
import { ReportTemplates } from './report-templates.enum';

export const reportGenerationRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
  ficheIds: z.array(z.number()).optional(),
  templateKey: z.enum(ReportTemplates).default('general_bilan_template'),
  logoFile: z.string().optional(), // Base64 encoded file (data URL format)
});

export type ReportGenerationRequest = z.infer<
  typeof reportGenerationRequestSchema
>;
