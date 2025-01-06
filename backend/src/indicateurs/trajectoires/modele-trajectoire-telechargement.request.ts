import { z } from 'zod';

export const modeleTrajectoireTelechargementRequestSchema = z.object({
  forceRecuperationXlsx: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
    .describe(
      'Récupère les données du fichier xlsx depuis le drive plutôt que le cache local'
    ),
});
export type ModeleTrajectoireTelechargementRequestType = z.infer<
  typeof modeleTrajectoireTelechargementRequestSchema
>;
