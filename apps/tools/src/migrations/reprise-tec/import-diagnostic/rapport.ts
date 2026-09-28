/** Le rapport : ce que l'import a lu, écrit et écarté. */

import type { Ecart } from './ecarts';

/** Affiche le bilan par table, les écarts par motif, les parties de ligne écartées, et le nombre de dossiers écrits. */
export const printRapport = ({
  bilan,
  ecarts,
  valeursEcrites,
  dossiersEcrits,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  valeursEcrites: number;
  dossiersEcrits: number;
  isConfirmed: boolean;
}) => {
  const compter = (valeurs: string[]) =>
    [...new Set(valeurs)]
      .sort()
      .map((v) => `${v} : ${valeurs.filter((x) => x === v).length}`);

  console.log('Lignes de T&C, par table : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par motif');
  for (const ligne of compter(ecarts.map((e) => e.motif))) {
    console.log(`  ${ligne}`);
  }
  console.log(
    'Dont parties de ligne écartées (consommation EnR, commentaires)'
  );
  for (const ligne of compter(
    ecarts
      .filter((e) => e.precision === 'consommation' || e.table === 'demarche')
      .map((e) => e.precision)
  )) {
    console.log(`  ${ligne}`);
  }
  console.log(
    `\n${valeursEcrites} valeurs écrites dans ${dossiersEcrits} dossiers, ${ecarts.length} écarts`
  );
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};
