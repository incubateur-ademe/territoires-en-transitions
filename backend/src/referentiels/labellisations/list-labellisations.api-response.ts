import z from 'zod';
import { collectiviteResumeSchema } from '../../collectivites/index-domain';
import { referentielIdEnumSchema } from '../../referentiels/index-domain';
import { labellisationTableSchema } from './labellisation.table';

const labellisationRecordSchema = labellisationTableSchema.omit({
  referentiel: true,
  collectiviteId: true,
});

export type LabellisationRecord = z.infer<typeof labellisationRecordSchema>;

export const collectiviteWithLabellisationSchema =
  collectiviteResumeSchema.extend({
    labellisations: z
      .record(
        referentielIdEnumSchema,
        z.object({
          courante: labellisationRecordSchema,
          historique: labellisationRecordSchema.array(),
        })
      )
      .optional(),
  });

export const listLabellisationApiResponseSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: collectiviteWithLabellisationSchema.array(),
});

export type ListLabellisationApiResponse = z.infer<
  typeof listLabellisationApiResponseSchema
>;
