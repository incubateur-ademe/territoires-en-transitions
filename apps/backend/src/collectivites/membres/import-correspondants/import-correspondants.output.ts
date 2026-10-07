import { z } from 'zod';

/** Le sort d'une ligne du fichier. L'ordre d'évaluation est dans le service. */
export const statutCorrespondantValues = [
  'invite',
  'rattache',
  'deja_membre',
  'deja_invite',
  'revoquee',
  'echec_envoi',
  'erreur',
] as const;

export const statutCorrespondantSchema = z.enum(statutCorrespondantValues);
export type StatutCorrespondant = z.infer<typeof statutCorrespondantSchema>;

export const resultatCorrespondantSchema = z.object({
  /** Numéro de ligne dans le fichier, pour pointer la source. */
  ligne: z.number(),
  email: z.string(),
  service: z
    .object({
      collectiviteId: z.number(),
      nom: z.string(),
      type: z.string(),
    })
    .nullable(),
  statut: statutCorrespondantSchema,
  motif: z.string().optional(),
});

export const importCorrespondantsOutputSchema = z.object({
  mode: z.enum(['a-blanc', 'envoi']),
  lignesLues: z.number(),
  envoisPrevus: z.number(),
  resultats: z.array(resultatCorrespondantSchema),
  totaux: z.record(statutCorrespondantSchema, z.number()),
});

export type ResultatCorrespondant = z.infer<typeof resultatCorrespondantSchema>;
export type ImportCorrespondantsOutput = z.infer<
  typeof importCorrespondantsOutputSchema
>;
