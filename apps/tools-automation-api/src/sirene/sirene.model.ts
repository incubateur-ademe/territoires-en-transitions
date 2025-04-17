import z from 'zod';

export const getTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export const headerSchema = z.object({
  statut: z.number(),
  message: z.string(),
  total: z.number().optional(),
  debut: z.number().optional(),
  nombre: z.number().optional(),
});

export const getNICResponseSchema = z.object({
  header: headerSchema,
  unitesLegales: z.object({
    siren: z.string(),
    periodesUniteLegale: z.object({
      dateFin: z.string().nullable(),
      dateDebut: z.string(),
      nicSiegeUniteLegale: z.string().nullable()
    }).array()
  }).array()
});

export type GetNICResponse = z.infer<typeof getNICResponseSchema>;

