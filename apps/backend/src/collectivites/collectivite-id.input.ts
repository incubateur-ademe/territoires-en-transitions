import { z } from 'zod';

export const collectiviteIdInputSchema = z.object({
  collectiviteId: z.int(),
});

export type CollectiviteIdInput = z.infer<typeof collectiviteIdInputSchema>;

export const collectiviteIdInputSchemaCoerce = z.object({
  collectiviteId: z.coerce
    .number()
    .int()
    .describe('Identifiant de la collectivité'),
});

export const collectiviteIdInputSchemaPartial =
  collectiviteIdInputSchemaCoerce.partial();

export const collectiviteAnyIdentifiantInputSchema = z.object({
  ...collectiviteIdInputSchemaPartial.shape,
  siren: z.string().optional().describe('Siren de la collectivité'),
  communeCode: z
    .string()
    .optional()
    .describe('Code commune de la collectivité'),
});
