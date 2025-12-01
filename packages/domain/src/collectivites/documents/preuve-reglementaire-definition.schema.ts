import * as z from 'zod/mini';

export const preuveReglementaireDefinitionSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
});

export type PreuveReglementaireDefinition = z.infer<
  typeof preuveReglementaireDefinitionSchema
>;
