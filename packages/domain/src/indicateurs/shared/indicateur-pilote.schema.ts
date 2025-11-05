import * as z from 'zod/mini';

export const indicateurPiloteSchemaCreate = z.object({
  indicateurId: z.optional(z.nullable(z.number())),
  tagId: z.optional(z.nullable(z.number())),
  userId: z.optional(z.nullable(z.uuid())),
  collectiviteId: z.optional(z.nullable(z.number())),
});

export type IndicateurPiloteCreate = z.infer<typeof indicateurPiloteSchemaCreate>;

