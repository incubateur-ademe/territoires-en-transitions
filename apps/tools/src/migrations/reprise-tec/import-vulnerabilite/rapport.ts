/** Le rapport : ce que l'import a lu et écrit. */

import type { Valeur } from './fusion';
import type { Ligne } from './lignes';

/** Affiche les lignes lues et écrites, les lignes TeT par niveau, et les « Déchets ». */
export const printRapport = ({
  lignes,
  valeurs,
  ecrites,
  dechets,
  isConfirmed,
}: {
  lignes: readonly Ligne[];
  valeurs: readonly Valeur[];
  ecrites: { lignes: number; demarches: number };
  dechets: { creees: number; reutilisees: number };
  isConfirmed: boolean;
}) => {
  const aEcrire = valeurs.filter((v) => v.aEcrire);
  const sansThematique = lignes.filter((l) => l.thematique === null).length;
  const lignesEcrites = valeurs.flatMap((v) =>
    v.lignes.filter((l) => l.ecrite)
  ).length;

  console.log(
    `${lignes.length} lignes T&C lues sur les dossiers repris : ${
      lignes.length - sansThematique
    } avec une thématique, ${sansThematique} sans`
  );
  console.log(`${lignesEcrites} lignes T&C écrites`);
  console.log(
    `${ecrites.lignes} lignes de demarche_pcaet_vulnerabilite_valeur, sur ${ecrites.demarches} démarches :`
  );
  for (const [nom, n] of [
    ['non concerné', aEcrire.filter((v) => v.niveau === 'non_concerne')],
    ['faible', aEcrire.filter((v) => v.niveau === 'faible')],
    ['moyen', aEcrire.filter((v) => v.niveau === 'moyen')],
    ['fort', aEcrire.filter((v) => v.niveau === 'fort')],
    ['objectif sans niveau', aEcrire.filter((v) => v.niveau === null)],
  ] as const) {
    console.log(`  ${nom} : ${n.length}`);
  }
  console.log(
    `« Déchets » : ${dechets.creees} créées, ${dechets.reutilisees} réutilisées (déjà là dans la collectivité)`
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
