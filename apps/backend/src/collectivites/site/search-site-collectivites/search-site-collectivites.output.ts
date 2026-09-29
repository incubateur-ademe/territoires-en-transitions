import { z } from 'zod';

export const siteCollectiviteSearchResultSchema = z.object({
  codeSirenInsee: z.string().nullable(),
  nom: z.string().nullable(),
});

export type SiteCollectiviteSearchResult = z.infer<
  typeof siteCollectiviteSearchResultSchema
>;
