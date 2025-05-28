import {
  collectiviteNatureEnumSchema,
  collectiviteTypeEnumSchema,
} from '@/backend/collectivites/index-domain';
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
});

export type ListCollectiviteApiRequest = z.infer<
  typeof listCollectiviteApiRequestSchema
>;
