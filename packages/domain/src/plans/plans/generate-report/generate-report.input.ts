import z from 'zod';
import { ReportTemplates } from './report-templates.enum';

export const ficheInformationsModeValues = [
  'manual',
  'auto_last_note',
] as const;

export const ficheInformationsModeSchema = z
  .enum(ficheInformationsModeValues)
  .default('auto_last_note');

export type FicheInformationsMode = z.infer<typeof ficheInformationsModeSchema>;

export const generateReportInputSchema = z.object({
  planId: z.number(),
  ficheIds: z.array(z.number()).optional(),
  templateKey: z.enum(ReportTemplates).default('general_bilan_template'),
  includeFicheIndicateursSlides: z.boolean().optional().default(true),
  logoFile: z.string().optional(), // Base64 encoded file (data URL format)
  ficheInformationsMode: ficheInformationsModeSchema,
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;
