import { z } from 'zod';

// Schéma pour les pourcentages régionaux (clé = code région, valeur = pourcentage)
const PourcentagesRegionauxSchema = z.record(z.string(), z.number());

// Schéma pour un levier
const LevierSchema = z.object({
  nom: z.string().describe('Leviers SGPE'),
  sousSecteursIdentifiants: z
    .array(z.string())
    .optional()
    .describe(
      'Identifiants des sous-secteurs utilisés pour obtenir la reduction potentielle de ce levier'
    ),
  pourcentagesRegionaux: PourcentagesRegionauxSchema,
});

// Schéma pour un secteur
const SecteurSchema = z.object({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiants: z
    .array(z.string())
    .describe(
      'Identifiants des indicateurs utilisés pour obtenir les valeurs de ce secteur'
    ),
  couleur: z.string().optional().describe('Optionnel pour personnalisation'),
  leviers: z.array(LevierSchema),
});

// Schéma principal pour la configuration des leviers régionaux
export const mondrianLeviersRegionConfigurationSchema = z.object({
  secteurs: z.array(SecteurSchema),
});

// Type TypeScript dérivé du schéma
export type MondrianLeviersRegionConfiguration = z.infer<
  typeof mondrianLeviersRegionConfigurationSchema
>;
