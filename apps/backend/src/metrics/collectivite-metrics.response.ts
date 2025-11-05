import { labellisationRecordSchema } from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import { referentielIdEnumSchema } from '@/domain/referentiels';
import z from 'zod';

export const collectiviteMetricsResponseSchema = z.object({
  labellisations: z.partialRecord(
    referentielIdEnumSchema,
    labellisationRecordSchema
  ),
  plans: z.object({
    count: z.number(),
    fiches: z.number(),
  }),
  indicateurs: z.object({
    favoris: z.number(),
    personnalises: z.number(),
  }),
});

export type CollectiviteMetricsResponse = z.infer<
  typeof collectiviteMetricsResponseSchema
>;
