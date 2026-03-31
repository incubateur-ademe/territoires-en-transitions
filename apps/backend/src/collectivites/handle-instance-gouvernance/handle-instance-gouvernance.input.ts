import z from 'zod';

export const createInstanceGouvernanceInputSchema = z.object({
  nom: z.string().min(1),
  collectiviteId: z.number(),
});

export const listInstanceGouvernanceInputSchema = z.object({
  collectiviteId: z.number(),
});

export const deleteInstanceGouvernanceInputSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
});

export const updateInstanceGouvernanceInputSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  nom: z.string().min(1),
});
