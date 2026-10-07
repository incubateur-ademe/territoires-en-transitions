import { z } from 'zod';

export const searchSiteCollectivitesInputSchema = z.object({
  search: z.string().max(200),
});

export type SearchSiteCollectivitesInput = z.infer<
  typeof searchSiteCollectivitesInputSchema
>;
