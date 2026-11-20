/** Le rapport : ce que l'import a lu, écrit et écarté, et les cas à connaître. */

import type { Ecart } from '../import-fiches/ecarts';
import type { Bibliotheque } from './bibliotheque';
import type { Fichier, UrlSiteWeb } from './pieces';
import type { UrlSiteWebValide } from './url-site-web';

/** Affiche le bilan par table, les écarts, ce qui est écrit et les cas nommés. */
export const printRapport = ({
  bilan,
  ecarts,
  fichiers,
  urlsSiteWeb,
  bibliotheque,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  fichiers: readonly Fichier[];
  urlsSiteWeb: {
    valides: readonly UrlSiteWebValide[];
    refuses: readonly UrlSiteWeb[];
  };
  bibliotheque: Pick<Bibliotheque, 'creees' | 'reutilisees'>;
  isConfirmed: boolean;
}) => {
  const fiches = new Set(
    [...fichiers, ...urlsSiteWeb.valides].map((p) => p.ficheId)
  );
  const compter = (table: Fichier['table']) =>
    fichiers.filter((f) => f.table === table).length;

  console.log('Lignes de T&C, par table : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par table et par motif');
  printComptes(ecarts.map((e) => `${e.table}, ${e.motif}`));

  console.log(
    `\n${fichiers.length + urlsSiteWeb.valides.length} annexes sur ${
      fiches.size
    } fiches, dont « Modifié le » est remis tel qu'il était`
  );
  console.log(
    `  ${fichiers.length} fichiers (${compter(
      'action_fichier'
    )} de action_fichier, ${compter('action_image')} de action_image)`
  );
  console.log(`  ${urlsSiteWeb.valides.length} « site web »`);
  console.log(
    `Bibliothèque : ${bibliotheque.creees} lignes créées, ${bibliotheque.reutilisees.length} fichiers sur une ligne qui existait déjà`
  );

  console.log(
    `\n« Site web » par collectivité : ${
      new Set(urlsSiteWeb.valides.map((u) => u.collectivite)).size
    }`
  );
  printComptes(urlsSiteWeb.valides.map((u) => u.collectivite));

  printCas(
    'Fichiers sur une ligne de bibliothèque qui existait déjà',
    bibliotheque.reutilisees.map(
      (f) => `${f.collectivite} : « ${f.nom} » (${f.table} ${f.tecId})`
    )
  );
  printCas(
    '« Site web » refusés par le produit',
    urlsSiteWeb.refuses.map(
      (u) => `${u.collectivite}, action T&C ${u.tecId} : ${u.adresse}`
    )
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

const printComptes = (valeurs: readonly string[]) => {
  for (const v of [...new Set(valeurs)].sort()) {
    console.log(`  ${v} : ${valeurs.filter((x) => x === v).length}`);
  }
};

const printCas = (titre: string, cas: readonly string[]) => {
  console.log(`\n${titre} : ${cas.length}`);
  for (const c of cas) {
    console.log(`  ${c}`);
  }
};
