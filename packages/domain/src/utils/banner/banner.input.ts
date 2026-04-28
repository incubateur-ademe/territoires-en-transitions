import { z } from 'zod';
import { bannerOutputSchema } from './banner.output';

/**
 * Pure projection of the output schema — drops server-managed fields. The
 * `info` constraint lives on `bannerOutputSchema` so this stays an honest
 * derivation (no re-declaration / override).
 */
export const upsertBannerInputSchema = bannerOutputSchema.omit({
  modifiedAt: true,
  modifiedByNom: true,
});

export type UpsertBannerInput = z.infer<typeof upsertBannerInputSchema>;
