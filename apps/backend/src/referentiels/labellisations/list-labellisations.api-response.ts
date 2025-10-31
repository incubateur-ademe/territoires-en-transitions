import { collectiviteResumeSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { labellisationSchema } from '@/backend/referentiels/labellisations/labellisation.table';
import { referentielIdEnumSchema } from '@/backend/referentiels/models/referentiel-id.enum';
import z from 'zod';

export const labellisationRecordSchema = labellisationSchema.partial({
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
          historique: labellisationRecordSchema.array(),
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
