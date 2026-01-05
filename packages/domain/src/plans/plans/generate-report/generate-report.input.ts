import z from 'zod';
import { ReportTemplates } from './report-templates.enum';

export const generateReportInputSchema = z.object({
  planId: z.number(),
  ficheIds: z.array(z.number()).optional(),
  templateKey: z.enum(ReportTemplates).default('general_bilan_template'),
  includeFicheIndicateursSlides: z.boolean().optional().default(true),
  logoFile: z.string().optional(), // Base64 encoded file (data URL format)
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
