import z from 'zod';

export const createInstanceGouvernanceRequestSchema = z.object({
  nom: z.string().min(1),
  actionId: z.number(),
  collectiviteId: z.number(),
});

export const listInstanceGouvernanceRequestSchema = z.object({
  collectiviteId: z.number(),
});

export const deleteInstanceGouvernanceRequestSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
});

export const updateInstanceGouvernanceRequestSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  nom: z.string().min(1),
});
