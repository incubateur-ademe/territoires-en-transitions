import { countSyntheseValeurSchema } from '@/backend/utils';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getFichesActionSyntheseSchema = extendApi(
  z.object({
    par_statut: countSyntheseValeurSchema,
  })
);

export type GetFichesActionSyntheseResponseType = z.infer<
  typeof getFichesActionSyntheseSchema
>;
