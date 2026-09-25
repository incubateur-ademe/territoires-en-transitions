import { appLabels } from '@/app/labels/catalog';
import { z } from 'zod';

export const lienFormSchema = z.object({
  titre: z.string().trim().min(1, appLabels.validationTitreLienRequis),
  url: z.url({
    protocol: /^https?$/,
    error: appLabels.validationLienValide,
  }),
});

export type LienFormValues = z.infer<typeof lienFormSchema>;
