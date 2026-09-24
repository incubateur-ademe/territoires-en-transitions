/** Le rapport : ce que l'import a lu et écrit. */

import type { LigneDiagnostic, Valeur } from './diagnostic';

/** Affiche, par table, les lignes lues et les valeurs écrites, puis le nombre de dossiers. */
export const printRapport = ({
  lignes,
  valeurs,
  dossiersEcrits,
  isConfirmed,
}: {
  lignes: readonly LigneDiagnostic[];
  valeurs: readonly Valeur[];
  dossiersEcrits: number;
  isConfirmed: boolean;
}) => {
  const tables = [...new Set(lignes.map((l) => l.table))].sort();
  for (const table of tables) {
    const lues = lignes.filter((l) => l.table === table).length;
    const ecrites = valeurs.filter((v) => v.ligne.table === table).length;
    console.log(`${table} : ${lues} lignes lues, ${ecrites} valeurs écrites`);
  }
  console.log(
    `\n${valeurs.length} valeurs écrites dans ${dossiersEcrits} dossiers`
  );
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
