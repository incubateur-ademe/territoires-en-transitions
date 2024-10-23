import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { countSyntheseSchema } from '../../common/models/count-synthese.dto';

extendZodWithOpenApi(z);

export const getFichesActionSyntheseSchema = extendApi(
  z.object({
    par_statut: countSyntheseSchema,
  })
);

export type GetFichesActionSyntheseResponseType = z.infer<
  typeof getFichesActionSyntheseSchema
>;
