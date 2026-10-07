import { appLabels } from '@/app/labels/catalog';
import { LIEN_URL_PROTOCOLS } from '@tet/domain/collectivites';
import { z } from 'zod';

export const lienFormSchema = z.object({
  titre: z.string().trim().min(1, appLabels.validationTitreLienRequis),
  url: z
    .string()
    .trim()
    .pipe(
      z.url({
        protocol: LIEN_URL_PROTOCOLS,
        error: appLabels.validationLienValide,
      })
    ),
});

export type LienFormValues = z.infer<typeof lienFormSchema>;
