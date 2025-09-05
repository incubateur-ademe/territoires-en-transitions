import { z } from 'zod';

// Schéma pour un levier
export const mondrianLevierSchema = z.object({
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
export type MondrianLevier = z.infer<typeof mondrianLevierSchema>;

const mondrianDataSchema = z.object({
  resultat2019: z.number().describe('Valeur réelle 2019').nullable(),
  objectif2019: z.number().describe('Objectif 2019').nullable(),
  objectif2030: z.number().describe('Objectif 2030').nullable(),
});
export type MondrianData = z.infer<typeof mondrianDataSchema>;

export const mondrianSousSecteurSchema = mondrianDataSchema.extend({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiant: z.string().describe('Identifiant du secteur'),
});
export type MondrianSousSecteur = z.infer<typeof mondrianSousSecteurSchema>;

// Schéma pour un secteur
export const mondrianSecteurSchema = mondrianDataSchema.extend({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiants: z
    .array(z.string())
    .describe(
      'Identifiants des indicateurs utilisés pour obtenir les valeurs de ce secteur'
    ),
  couleur: z.string().optional().describe('Optionnel pour personnalisation'),
  sousSecteurs: z
    .array(mondrianSousSecteurSchema)
    .describe('Sous-secteurs du secteur'),
  leviers: z.array(mondrianLevierSchema),
});
export type MondrianSecteur = z.infer<typeof mondrianSecteurSchema>;

// Schéma principal pour la configuration des leviers régionaux
export const getMondrianLeviersDataResponseSchema = z.object({
  sourcesResultats: z
    .array(z.string())
    .describe("Sources des valeurs d'émission observées"),
  identifiantManquants: z
    .array(z.string())
    .describe(
      'Identifiants des indicateurs pour lesquels il manque des données'
    ),
  secteurs: z.array(mondrianSecteurSchema),
});

// Type TypeScript dérivé du schéma
export type GetMondrianLeviersDataResponse = z.infer<
  typeof getMondrianLeviersDataResponseSchema
>;
