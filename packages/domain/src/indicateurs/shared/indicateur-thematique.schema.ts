import * as z from 'zod/mini';

export const indicateurThematiqueSchema = z.object({
  indicateurId: z.number(),
  thematiqueId: z.number(),
});

export type IndicateurThematique = z.infer<typeof indicateurThematiqueSchema>;
export type IndicateurThematiqueCreate = z.infer<typeof indicateurThematiqueSchema>;

