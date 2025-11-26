import { z } from 'zod';

export const createAxeSchema = z.object({
  nom: z.string().nonempty("Le nom de l'axe est requis"),
  collectiviteId: z.number().positive("L'ID de la collectivité est requis"),
  planId: z.number().positive("Identifiant du plan auquel appartient l'axe"),
  parent: z
    .number()
    .positive(
      "Identifiant de l'axe parent, en cas de sous-axe, ou du plan sinon"
    ),
});
export type CreateAxeInput = z.infer<typeof createAxeSchema>;

const updateAxeSchema = createAxeSchema.partial().extend({
  id: z.number().positive("Identifiant de l'axe à modifier"),
  collectiviteId: z.number().positive("L'ID de la collectivité est requis"),
});
export type UpdateAxeInput = z.infer<typeof updateAxeSchema>;

export const mutateAxeSchema = z.union([createAxeSchema, updateAxeSchema]);
export type MutateAxeInput = z.infer<typeof mutateAxeSchema>;
