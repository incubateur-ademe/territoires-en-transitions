import { labellisationRecordSchema } from '@tet/backend/referentiels/labellisations/list-labellisations.api-response';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const collectiviteMetricsOutputSchema = z.object({
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

export type CollectiviteMetricsOutput = z.infer<
  typeof collectiviteMetricsOutputSchema
>;
