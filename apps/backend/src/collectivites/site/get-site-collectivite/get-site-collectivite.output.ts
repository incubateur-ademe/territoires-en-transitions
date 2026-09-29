import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { siteEtoilesSchema } from '../site-etoiles.schema';

const siteLabellisationSchema = z.object({
  id: z.number(),
  referentiel: referentielIdEnumSchema,
  annee: z.number().nullable(),
  etoiles: siteEtoilesSchema,
  scoreRealise: z.number().nullable(),
});

const siteIndicateurGesSchema = z.object({
  dateValeur: z.string(),
  resultat: z.number(),
  identifiant: z.string(),
  source: z.string(),
});

const siteIndicateurArtificialisationSchema = z.object({
  total: z.number().nullable(),
  activite: z.number().nullable(),
  habitat: z.number().nullable(),
  mixte: z.number().nullable(),
  routiere: z.number().nullable(),
  ferroviaire: z.number().nullable(),
  inconnue: z.number().nullable(),
});

export const siteCollectiviteSchema = z.object({
  collectiviteId: z.number(),
  nom: z.string().nullable(),
  typeCollectivite: z.string().nullable(),
  natureCollectivite: z.string().nullable(),
  codeSirenInsee: z.string().nullable(),
  regionName: z.string().nullable(),
  regionCode: z.string().nullable(),
  departementName: z.string().nullable(),
  departementCode: z.string().nullable(),
  populationTotale: z.number().nullable(),
  active: z.boolean(),
  labellisee: z.boolean(),
  caeEtoiles: siteEtoilesSchema.nullable(),
  eciEtoiles: siteEtoilesSchema.nullable(),
  labellisations: z.array(siteLabellisationSchema),
  indicateursGazEffetSerre: z.array(siteIndicateurGesSchema).nullable(),
  indicateurArtificialisation: siteIndicateurArtificialisationSchema.nullable(),
});

export type SiteLabellisation = z.infer<typeof siteLabellisationSchema>;
export type SiteIndicateurGes = z.infer<typeof siteIndicateurGesSchema>;
export type SiteIndicateurArtificialisation = z.infer<
  typeof siteIndicateurArtificialisationSchema
>;
export type SiteCollectivite = z.infer<typeof siteCollectiviteSchema>;
