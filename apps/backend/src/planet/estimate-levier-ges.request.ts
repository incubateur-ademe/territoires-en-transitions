import { z } from 'zod';

export const estimateLevierGesRequestSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      'Identifiant du levier, par exemple `haies` ou `transport_marchandises_report_modal`'
    ),
  territory: z
    .object({
      level: z.enum(['region', 'departement', 'epci']),
      code: z
        .string()
        .min(1)
        .describe(
          "Code INSEE de la région ou du département, ou SIREN de l'EPCI"
        ),
    })
    .optional()
    .describe(
      'Absent pour les leviers `haies` et `pratiques_stockantes`, obligatoire pour les autres'
    ),
  parameters: z
    .record(z.string(), z.unknown())
    .default({})
    .describe(
      'Paramètres du levier, vides pour les leviers sans paramètre. Les décimaux se passent en texte (`"0.1"`).'
    ),
});
export type EstimateLevierGesRequest = z.infer<
  typeof estimateLevierGesRequestSchema
>;
