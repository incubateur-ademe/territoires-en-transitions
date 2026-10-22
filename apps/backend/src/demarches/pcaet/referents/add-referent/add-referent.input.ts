import { z } from 'zod';

const cible = {
  collectiviteId: z.number().int().positive(),
  organismeId: z.number().int().positive(),
};

export const addReferentInputSchema = z.union([
  z.object({ ...cible, userId: z.uuid() }),
  z.object({
    ...cible,
    libelle: z.string().trim().min(1),
    email: z.email().trim().toLowerCase(),
  }),
]);

export type AddReferentInput = z.infer<typeof addReferentInputSchema>;
