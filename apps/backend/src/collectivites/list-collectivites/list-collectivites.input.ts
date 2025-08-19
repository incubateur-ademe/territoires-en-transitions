import { listCollectivitesFieldsModeSchema } from '@/backend/collectivites/list-collectivites/list-collectivites-fields-mode.enum';
import { collectiviteNatureEnumSchema } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteTypeEnumSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import z from 'zod';

export const listCollectiviteInputSchema = z
  .object({
    text: z.string().optional(),
    limit: z.number().optional(),
    page: z.number().default(1),
    type: collectiviteTypeEnumSchema.optional(),
    collectiviteId: z.number().int().optional(),
    natureInsee: collectiviteNatureEnumSchema.optional(),
    communeCode: z.string().optional(),
    siren: z.string().optional(),
    fieldsMode: listCollectivitesFieldsModeSchema.optional(),
    withRelations: z.boolean().optional(),
  })
  .optional()
  .default({ limit: 20, fieldsMode: 'resume' });

export type ListCollectiviteInput = z.infer<typeof listCollectiviteInputSchema>;
