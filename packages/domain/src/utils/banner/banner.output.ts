import { z } from 'zod';
import { bannerTypeEnumValues } from './banner-type.schema';

export const bannerOutputSchema = z.object({
  type: z.enum(bannerTypeEnumValues),
  // The constraint lives on output so the input schema can be a pure
  // projection (`omit`) without re-declaring it.
  info: z.string().max(50_000),
  active: z.boolean(),
  modifiedAt: z.string(),
  /**
   * Sentinel-formatted display label of the last modifier — never the raw
   * prenom/nom. The widget mounts globally, so leaking precise identity
   * would expose support staff to every authed user. Server emits the
   * literal "Équipe support".
   */
  modifiedByNom: z.string(),
});

export type BannerOutput = z.infer<typeof bannerOutputSchema>;

/** Return type of `banner.get` — null when the table is empty. */
export type BannerGetOutput = BannerOutput | null;
