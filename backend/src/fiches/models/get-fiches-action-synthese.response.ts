import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { countByRecordSchema } from '../../common/models/count-synthese.dto';

extendZodWithOpenApi(z);

export const getFichesActionSyntheseSchema = extendApi(
  z.object({
    par_statut: countByRecordSchema,
  })
);

export type GetFichesActionSyntheseResponseType = z.infer<
  typeof getFichesActionSyntheseSchema
>;
