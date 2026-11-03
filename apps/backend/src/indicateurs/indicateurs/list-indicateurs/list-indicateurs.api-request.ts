import { paginationNoSortSchemaOptionalLimit } from '@tet/domain/utils';
import { z } from 'zod';
import { listIndicateursPredefinisApiRequestSchema } from '../../definitions/list-indicateurs-predefinis/list-indicateurs-predefinis.api-request';

export const listIndicateursApiRequestSchema = z.object({
  ...paginationNoSortSchemaOptionalLimit.shape,

  ...listIndicateursPredefinisApiRequestSchema.shape,

  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});

export type ListIndicateursApiRequest = z.infer<
  typeof listIndicateursApiRequestSchema
>;
