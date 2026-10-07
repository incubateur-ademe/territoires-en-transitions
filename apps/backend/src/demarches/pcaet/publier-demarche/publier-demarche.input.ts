import { z } from 'zod';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';

/**
 * Publier vaut adopter : la seule chose que la transition demande en plus de
 * la démarche visée, c'est la date de la délibération d'adoption — une date
 * civile (AAAA-MM-JJ), saisie par la collectivité, qui fait courir la validité
 * du PCAET.
 */
export const publierDemarchePcaetInputSchema =
  demarchePcaetTransitionInputSchema.extend({
    dateAdoption: z.iso.date(),
  });

export type PublierDemarchePcaetInput = z.infer<
  typeof publierDemarchePcaetInputSchema
>;
