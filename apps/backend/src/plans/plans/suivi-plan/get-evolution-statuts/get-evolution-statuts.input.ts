import { z } from 'zod';
import { suiviPlanBlocInputSchema } from '../suivi-plan.input';

export const getEvolutionStatutsInputSchema = suiviPlanBlocInputSchema
  .extend({
    dateDebut: z.iso.date(),
    dateFin: z.iso.date(),
    inclureActionsContinues: z.boolean().default(false),
  })
  .refine(({ dateDebut, dateFin }) => dateDebut <= dateFin, {
    message: 'La date de début doit précéder la date de fin',
    path: ['dateDebut'],
  });

export type GetEvolutionStatutsInput = z.infer<
  typeof getEvolutionStatutsInputSchema
>;
