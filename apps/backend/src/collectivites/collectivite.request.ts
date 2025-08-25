import { z } from 'zod';

export const collectiviteRequestSchema = z.object({
  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});
export type CollectiviteRequestType = z.infer<typeof collectiviteRequestSchema>;

export const partialCollectiviteRequestSchema =
  collectiviteRequestSchema.partial();

export const collectiviteAnyIdentifiantRequestSchema =
  partialCollectiviteRequestSchema.extend({
    siren: z.string().optional().describe('Siren de la collectivité'),
    communeCode: z
      .string()
      .optional()
      .describe('Code commune de la collectivité'),
  });
