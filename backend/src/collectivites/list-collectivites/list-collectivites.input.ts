import {
  collectiviteNatureEnumSchema,
  collectiviteTypeEnumSchema,
} from '@/backend/collectivites/index-domain';
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
  })
  .optional()
  .default({ limit: 20 });

export type ListCollectiviteInput = z.infer<typeof listCollectiviteInputSchema>;
