import z from 'zod';

export const contactSchema = z.object({
  email: z.string(),
  nom: z.string(),
  prenom: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;

export const contactUpsertSchema = z.object({
  email: z.string(),
  siret: z.string(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  fonction: z.string().optional(),
  telephone: z.string().optional(),
  ancienMail: z.string().optional(),
  source: z.string(),
});

export type ContactUpsert = z.infer<typeof contactUpsertSchema>;
