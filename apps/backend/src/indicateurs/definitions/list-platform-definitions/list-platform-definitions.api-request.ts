import { z } from 'zod';

export const listPlatformDefinitionsApiRequestSchema = z.object({
  indicateurIds: z
    .string()
    .transform((value) => value.split(',').map(Number))
    .optional()
    .describe("Identifiants de l'indicateur (séparés par des virgules)"),

  identifiantsReferentiel: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.string().array())
    .optional()
    .describe('Identifiants du référentiel (séparés par des virgules)'),
});

export type ListPlatformDefinitionsApiRequest = z.infer<
  typeof listPlatformDefinitionsApiRequestSchema
>;
