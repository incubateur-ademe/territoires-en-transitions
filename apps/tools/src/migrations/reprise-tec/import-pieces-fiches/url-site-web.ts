/** Le « site web » d'une action, affiché comme un lien : T&C n'a que l'adresse, le produit exige une url http(s) et un titre. */

import * as z from 'zod/mini';
import type { UrlSiteWeb } from './pieces';

// Copie de `lienInputSchema` (`@tet/domain/collectivites`), arrivée sur `main`
// après la base de cette branche : à remplacer par l'import au rebase.
const lienInputSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  titre: z.string().check(z.trim(), z.minLength(1)),
});

export type UrlSiteWebValide = UrlSiteWeb & {
  lien: { url: string; titre: string };
};

/** Rend les « site web » que le produit accepte, avec leur lien, et ceux qu'il refuserait. */
export const buildUrlsSiteWeb = (urlsSiteWeb: readonly UrlSiteWeb[]) => {
  const valides: UrlSiteWebValide[] = [];
  const refuses: UrlSiteWeb[] = [];
  for (const u of urlsSiteWeb) {
    const lien = buildLien(u.adresse);
    if (lien === null) {
      refuses.push(u);
    } else {
      valides.push({ ...u, lien });
    }
  }
  return { valides, refuses };
};

/** Règle : l'adresse complète (`https://` ajouté s'il manque), titrée du nom du site sans `www.` ; `null` si le produit la refuserait. */
const buildLien = (adresse: string) => {
  const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(adresse)
    ? adresse
    : `https://${adresse}`;
  const titre = URL.canParse(url)
    ? new URL(url).hostname.replace(/^www\./, '')
    : '';
  const lien = lienInputSchema.safeParse({ url, titre });
  return lien.success ? lien.data : null;
};
