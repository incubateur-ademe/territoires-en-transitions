import { collectiviteResumeSchema } from '@tet/domain/collectivites';
import {
  labellisationSchema,
  referentielIdEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';
import * as zm from 'zod/mini';

export const labellisationRecordSchema = zm.partial(labellisationSchema, {
  collectiviteId: true,
});

export type LabellisationRecord = z.infer<typeof labellisationRecordSchema>;

export const collectiviteWithLabellisationSchema =
  collectiviteResumeSchema.extend({
    labellisations: z
      .partialRecord(
        referentielIdEnumSchema,
        z.object({
          courante: labellisationRecordSchema,
          historique: z.array(labellisationRecordSchema),
        })
      )
      .optional(),
  });

export type CollectiviteWithLabellisation = z.infer<
  typeof collectiviteWithLabellisationSchema
>;

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
