import { listCollectivitesFieldsModeSchema } from '@/backend/collectivites/list-collectivites/list-collectivites-fields-mode.enum';
import { collectiviteNatureEnumSchema } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteTypeEnumSchema } from '@/domain/collectivites';
import z from 'zod';

export const listCollectiviteApiRequestSchema = z.object({
  text: z.string().optional(),
  limit: z.coerce.number().int().default(20),
  page: z.coerce.number().int().default(1),
  type: collectiviteTypeEnumSchema.optional(),
  collectiviteId: z.coerce.number().int().optional(),
  natureInsee: collectiviteNatureEnumSchema.optional(),
  communeCode: z.string().optional(),
  siren: z.string().optional(),
  fieldsMode: listCollectivitesFieldsModeSchema.optional(),
});

export type ListCollectiviteApiRequest = z.infer<
  typeof listCollectiviteApiRequestSchema
>;
