import { z } from 'zod';

// Schéma pour les pourcentages régionaux (clé = code région, valeur = pourcentage)
const PourcentagesRegionauxSchema = z.record(z.string(), z.number());

// Schéma pour un levier
const LevierSchema = z.object({
  nom: z.string().describe('Leviers SGPE'),
  pourcentagesRegionaux: PourcentagesRegionauxSchema,
});

// Schéma pour un secteur
const SecteurSchema = z.object({
  nom: z.string().describe('Secteur Territorialisation SNBC'),
  identifiant: z.string().describe('Identifiant du secteur'),
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
