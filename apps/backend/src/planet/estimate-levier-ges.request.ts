import { z } from 'zod';

/**
 * Enveloppe de la requête. Les paramètres propres à chaque levier sont validés
 * (clés inconnues refusées, bornes, types) par `leviers-ges` : c'est la
 * seule source de vérité, on ne duplique pas ses schémas ici.
 * Voir le README du paquet npm `leviers-ges` pour la liste des leviers et paramètres.
 */
export const estimateLevierGesRequestSchema = z.object({
  id: z
    .string()
    .describe(
      "Identifiant du levier, par exemple `haies` ou `transport_marchandises_report_modal`"
    ),
  territory: z
    .object({
      level: z.enum(['region', 'departement', 'epci']),
      code: z
        .string()
        .describe("Code INSEE de la région ou du département, ou SIREN de l'EPCI"),
    })
    .optional()
    .describe(
      'Absent pour les leviers `haies` et `pratiques_stockantes`, obligatoire pour les autres'
    ),
  parameters: z
    .record(z.string(), z.unknown())
    .describe(
      'Paramètres du levier. Les décimaux se passent en texte (`"0.1"`).'
    ),
});
export type EstimateLevierGesRequest = z.infer<
  typeof estimateLevierGesRequestSchema
>;
