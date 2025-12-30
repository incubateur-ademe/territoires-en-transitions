import { paginationNoSortSchemaOptionalLimit } from '@tet/domain/utils';
import { z } from 'zod';
import { listPlatformDefinitionsApiRequestSchema } from '../../definitions/list-platform-definitions/list-platform-definitions.api-request';

export const listIndicateursApiRequestSchema = z.object({
  ...paginationNoSortSchemaOptionalLimit.shape,

  ...listPlatformDefinitionsApiRequestSchema.shape,

  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});

export type ListIndicateursApiRequest = z.infer<
  typeof listIndicateursApiRequestSchema
>;
