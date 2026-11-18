import { appLabels } from '@/app/labels/catalog';
import type { AiPlanImportProfile } from '@tet/domain/plans';
import { z } from 'zod';
import { genericImportConfig } from './ai-import-form.config';

export const isAiImportAcceptedFilename = (
  filename: string,
  extensions = genericImportConfig.fileExtensions
) => extensions.some((extension) => filename.toLowerCase().endsWith(extension));

const PDF_MIME_TYPE = 'application/pdf';

export const isAiImportVerifiable = (file: File) => file.type === PDF_MIME_TYPE;

export const aiImportFormSchema = z.object({
  file: z.file({ message: appLabels.importPlanIaFichierRequis }),
  planName: z.string().min(1, appLabels.importPlanIaNomRequis),
  planType: z.number().nullable(),
  instructions: z.string(),
  withVerifications: z.boolean(),
  withSousActions: z.boolean(),
});

export type AiImportFormValues = z.infer<typeof aiImportFormSchema>;

export type AiImportSubmission = AiImportFormValues & {
  profile: AiPlanImportProfile;
  confirmReimport: boolean;
};

export type AiImportDefaults = Partial<Omit<AiImportFormValues, 'file'>> & {
  fichierId?: number;
};
