import { z } from 'zod';

export const exportIndicateursRequestSchema = z
  .object({
    collectiviteId: z.number().int().describe('Identifiant de la collectivité'),
    indicateurIds: z
      .number()
      .int()
      .array()
      .describe('Identifiants des indicateurs'),
  })
  .describe('Export des indicateurs');
export type ExportIndicateursRequestType = z.infer<
  typeof exportIndicateursRequestSchema
>;
