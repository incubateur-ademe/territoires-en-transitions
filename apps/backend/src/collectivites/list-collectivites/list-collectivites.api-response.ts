import {
  collectivitePublicSchema,
  collectiviteResumeSchema,
} from '@/backend/collectivites/shared/models/collectivite.table';
import z from 'zod';

export const listCollectiviteApiResponseSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: z.union([collectiviteResumeSchema, collectivitePublicSchema]).array(),
});

export type ListCollectiviteApiResponse = z.infer<
  typeof listCollectiviteApiResponseSchema
>;
