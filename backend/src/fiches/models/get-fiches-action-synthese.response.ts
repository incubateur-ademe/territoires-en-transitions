import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { countSyntheseValeurSchema } from '../../common/models/count-synthese.dto';

export const getFichesActionSyntheseSchema = extendApi(
  z.object({
    par_statut: countSyntheseValeurSchema,
  })
);

export type GetFichesActionSyntheseResponseType = z.infer<
  typeof getFichesActionSyntheseSchema
>;
