import { z } from 'zod';

export const adminContactSchema = z.object({
  prenom: z.string(),
  nom: z.string(),
  email: z.string(),
});

export type AdminContact = z.infer<typeof adminContactSchema>;
