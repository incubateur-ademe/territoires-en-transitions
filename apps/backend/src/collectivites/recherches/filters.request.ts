import { z } from 'zod';

// Codes INSEE région : 2-3 chiffres (métropole + DROM).
const regionCodeSchema = z
  .string()
  .regex(/^[0-9]{1,3}$/, 'Code région invalide');

// Codes INSEE département : 1-3 chiffres ou 2A/2B (Corse).
const departmentCodeSchema = z
  .string()
  .regex(/^(?:[0-9]{1,3}|2[AB])$/i, 'Code département invalide');

// Identifiants de tranche stockés dans `filtre_intervalle.id`
// (ex: `<20000`, `20000-50000`, `50-64`, `80-99`).
const filterIntervalleIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_<>=-]+$/, 'Identifiant de tranche invalide');

// Types de collectivité (enum `collectiviteTypeEnum` + alias `syndicat`).
const typeCollectiviteSchema = z
  .string()
  .regex(/^[a-z_]+$/, 'Type de collectivité invalide');

// Niveau de labellisation : 0 à 5 étoiles.
const niveauLabelSchema = z
  .string()
  .regex(/^[0-5]$/, 'Niveau de labellisation invalide');

// Référentiel : `eci`, `cae`, `te`, `te-test`.
const referentielSchema = z
  .string()
  .regex(/^[a-z-]+$/, 'Référentiel invalide');

// Tri : `nom`, `completude`, `score`.
const trierParSchema = z.string().regex(/^[a-z]+$/, 'Tri invalide');

export const filtersRequestSchema = z.object({
  typesPlan: z.number().int().array(),
  nom: z.string().max(200).optional(),
  regions: regionCodeSchema.array(),
  departments: departmentCodeSchema.array(),
  typesCollectivite: typeCollectiviteSchema.array(),
  population: filterIntervalleIdSchema.array(),
  referentiel: referentielSchema.array(),
  niveauDeLabellisation: niveauLabelSchema.array(),
  realiseCourant: filterIntervalleIdSchema.array(),
  tauxDeRemplissage: filterIntervalleIdSchema.array(),
  trierPar: trierParSchema.array().optional(),
  page: z.number().int().min(1).optional(),
  nbCards: z.number().int().min(1).max(1000),
});
export type FiltersRequest = z.infer<typeof filtersRequestSchema>;
