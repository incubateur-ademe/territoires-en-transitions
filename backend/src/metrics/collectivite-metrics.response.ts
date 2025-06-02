import { referentielIdEnumSchema } from '@/backend/referentiels/index-domain';
import { labellisationRecordSchema } from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import z from 'zod';

export const collectiviteMetricsResponseSchema = z.object({
  labellisations: z.record(referentielIdEnumSchema, labellisationRecordSchema),
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
