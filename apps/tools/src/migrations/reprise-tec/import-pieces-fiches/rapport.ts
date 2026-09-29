/** Le rapport : ce que l'import a écrit sur les fiches. */

import type { Bibliotheque } from './bibliotheque';
import type { Fichier, UrlSiteWeb } from './pieces';
import type { UrlSiteWebValide } from './url-site-web';

/** Affiche les annexes écrites et les lignes de bibliothèque créées ou réutilisées. */
export const printRapport = ({
  fichiers,
  urlsSiteWeb,
  bibliotheque,
  isConfirmed,
}: {
  fichiers: readonly Fichier[];
  urlsSiteWeb: {
    valides: readonly UrlSiteWebValide[];
    refuses: readonly UrlSiteWeb[];
  };
  bibliotheque: Bibliotheque['comptes'];
  isConfirmed: boolean;
}) => {
  const fiches = new Set(
    [...fichiers, ...urlsSiteWeb.valides].map((p) => p.ficheId)
  );
  const compter = (table: Fichier['table']) =>
    fichiers.filter((f) => f.table === table).length;

  console.log(
    `${fichiers.length + urlsSiteWeb.valides.length} annexes sur ${
      fiches.size
    } fiches`
  );
  console.log(
    `  ${compter('action_fichier')} pièces, ${compter('action_image')} images`
  );
  console.log(
    `  ${urlsSiteWeb.valides.length} « site web », ${urlsSiteWeb.refuses.length} refusés par la règle du produit`
  );
  console.log(
    `Bibliothèque : ${bibliotheque.creees} lignes créées, ${bibliotheque.reutilisees} réutilisées`
  );
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
