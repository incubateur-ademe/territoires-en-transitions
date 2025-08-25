import z from 'zod';

// Schema for the CSV data from data.gouv.fr
// See https://www.data.gouv.fr/datasets/base-nationale-sur-les-intercommunalites/
export const epciPerimetreSchema = z.object({
  dept: z.string(),
  siren: z.string(),
  raison_sociale: z.string(),
  nature_juridique: z.string(),
  mode_financ: z.string(),
  nb_membres: z.coerce.number(),
  total_pop_tot: z
    .string()
    .transform((val) => val.replace(/\s+/g, '')) // strip spaces
    .pipe(z.coerce.number())
    .optional(),
  total_pop_mun: z
    .string()
    .transform((val) => val.replace(/\s+/g, '')) // strip spaces
    .pipe(z.coerce.number())
    .optional(),
  dep_com: z.string(),
  insee: z.string(),
  siren_membre: z.string(),
  nom_membre: z.string(),
  ptot_2025: z
    .string()
    .transform((val) => val.replace(/\s+/g, '')) // strip spaces
    .pipe(z.coerce.number())
    .optional(),
  pmun_2025: z
    .string()
    .transform((val) => val.replace(/\s+/g, '')) // strip spaces
    .pipe(z.coerce.number())
    .optional(),
});

export type EpciPerimetre = z.infer<typeof epciPerimetreSchema>;
