import { z } from 'zod';

export const getValeursReferenceRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
    indicateurIds: z.coerce
      .number()
      .int()
      .array()
      .describe("Identifiant de l'indicateur"),
  })
  .describe(
    'Donne les valeurs de référence (cible et/ou seuil) des indicateurs pour une collectivité'
  );

export type GetValeursReferenceRequest = z.infer<typeof getValeursReferenceRequestSchema>;
