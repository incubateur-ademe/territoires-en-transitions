import z from 'zod';
import { ReportTemplates } from './report-templates.enum';

export const reportGenerationInputSchema = z.object({
  planId: z.number(),
  ficheIds: z.array(z.number()).optional(),
  templateKey: z.enum(ReportTemplates).default('general_bilan_template'),
  includeFicheIndicateursSlides: z.boolean().optional().default(true),
  logoFile: z.string().optional(), // Base64 encoded file (data URL format)
});

export type ReportGenerationInput = z.infer<typeof reportGenerationInputSchema>;
