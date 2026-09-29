import { z } from 'zod';
import { siteEtoilesSchema } from '../site-etoiles.schema';

/** Contour GeoJSON, transmis tel quel à Leaflet. */
const geojsonSchema = z.record(z.string(), z.unknown()).nullable();

export const siteCarteCollectiviteSchema = z.object({
  collectiviteId: z.number(),
  nom: z.string().nullable(),
  typeCollectivite: z.string().nullable(),
  natureCollectivite: z.string().nullable(),
  codeSirenInsee: z.string().nullable(),
  regionName: z.string().nullable(),
  departementName: z.string().nullable(),
  populationTotale: z.number().nullable(),
  cot: z.boolean(),
  engagee: z.boolean(),
  labellisee: z.boolean(),
  caeEtoiles: siteEtoilesSchema.nullable(),
  eciEtoiles: siteEtoilesSchema.nullable(),
  geojson: geojsonSchema,
});

export const siteCarteRegionSchema = z.object({
  insee: z.string(),
  libelle: z.string().nullable(),
  geojson: geojsonSchema,
});

export const listSiteCarteOutputSchema = z.object({
  collectivites: z.array(siteCarteCollectiviteSchema),
  regions: z.array(siteCarteRegionSchema),
});

export type SiteCarteCollectivite = z.infer<typeof siteCarteCollectiviteSchema>;
export type SiteCarteRegion = z.infer<typeof siteCarteRegionSchema>;
export type ListSiteCarteOutput = z.infer<typeof listSiteCarteOutputSchema>;
