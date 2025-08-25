import { z } from 'zod';

// Schéma pour un levier
export const trajectoireLevierSchema = z.object({
  nom: z.string().describe('Leviers SGPE'),
  sousSecteursIdentifiants: z
    .array(z.string())
    .optional()
    .describe(
      'Identifiants des sous-secteurs utilisés pour obtenir la reduction potentielle de ce levier'
    ),
  pourcentageRegional: z.number(),
  objectifReduction: z.number().nullable(),
});
export type TrajectoireLevier = z.infer<typeof trajectoireLevierSchema>;

const trajectoireDataSchema = z.object({
  resultat2019: z.number().describe('Valeur réelle 2019').nullable(),
  objectif2019: z.number().describe('Objectif 2019').nullable(),
  objectif2030: z.number().describe('Objectif 2030').nullable(),
});
export type TrajectoireData = z.infer<typeof trajectoireDataSchema>;

export const trajectoireSousSecteurSchema = trajectoireDataSchema.extend({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiant: z.string().describe('Identifiant du secteur'),
});
export type TrajectoireSousSecteur = z.infer<
  typeof trajectoireSousSecteurSchema
>;

// Schéma pour un secteur
export const trajectoireSecteurSchema = trajectoireDataSchema.extend({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiants: z
    .array(z.string())
    .describe(
      'Identifiants des indicateurs utilisés pour obtenir les valeurs de ce secteur'
    ),
  couleur: z.string().optional().describe('Optionnel pour personnalisation'),
  sousSecteurs: z
    .array(trajectoireSousSecteurSchema)
    .describe('Sous-secteurs du secteur'),
  leviers: z.array(trajectoireLevierSchema),
});
export type TrajectoireSecteur = z.infer<typeof trajectoireSecteurSchema>;

// Schéma principal pour la configuration des leviers régionaux
export const getTrajectoireLeviersDataResponseSchema = z.object({
  sourcesResultats: z
    .array(z.string())
    .describe("Sources des valeurs d'émission observées"),
  identifiantManquants: z
    .array(z.string())
    .describe(
      'Identifiants des indicateurs pour lesquels il manque des données'
    ),
  secteurs: z.array(trajectoireSecteurSchema),
});

// Type TypeScript dérivé du schéma
export type GetTrajectoireLeviersDataResponse = z.infer<
  typeof getTrajectoireLeviersDataResponseSchema
>;
