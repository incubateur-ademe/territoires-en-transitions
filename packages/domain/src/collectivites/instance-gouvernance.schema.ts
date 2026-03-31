import z from 'zod';

export const instanceGouvernanceTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
  createdAt: z.string().nullable(),
  createdBy: z.string().nullable(),
});

export type InstanceGouvernance = z.infer<typeof instanceGouvernanceTagSchema>;
