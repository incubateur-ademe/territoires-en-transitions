import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const getPanierCompletRequestSchema = extendApi(
  z
    .object({
      panierId: z.string().openapi({ description: `Identifiant du panier` }),
      thematiquesIds: z
        .array(z.number())
        .openapi({ description: `Identifiant des thématiques` }),
      niveauxBudget: z
        .array(z.number())
        .openapi({ description: `Niveaux des budgets` }),
      niveauxTemps: z
        .array(z.number())
        .openapi({ description: `Niveaux des temps de mise en oeuvre` }),
    })
    .openapi({
      title:
        'Identifiant du panier et filtres à appliquer sur le contenu à récupérer.',
    })
);

export class GetPanierCompletRequestClass extends createZodDto(
  getPanierCompletRequestSchema
) {}
