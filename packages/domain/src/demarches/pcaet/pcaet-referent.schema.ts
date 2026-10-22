import * as z from 'zod/mini';

/**
 * Un référent est un membre de l'organisme, ou un contact hors plateforme — une
 * boîte fonctionnelle, typiquement — dont on ne connaît que le libellé et
 * l'e-mail.
 */
export const pcaetReferentSchema = z.object({
  id: z.number(),
  organismeId: z.number(),
  userId: z.nullable(z.string()),
  nom: z.string(),
  email: z.string(),
});

export type PcaetReferent = z.infer<typeof pcaetReferentSchema>;
