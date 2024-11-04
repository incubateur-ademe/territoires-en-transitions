import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const modeleTrajectoireTelechargementRequestSchema = extendApi(
    z.object({
      forceRecuperationXlsx: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
        .openapi({
          description:
            'Récupère les données du fichier xlsx depuis le drive plutôt que le cache local',
        }),
    })
  );
  export type ModeleTrajectoireTelechargementRequestType = z.infer<
    typeof modeleTrajectoireTelechargementRequestSchema
  >;