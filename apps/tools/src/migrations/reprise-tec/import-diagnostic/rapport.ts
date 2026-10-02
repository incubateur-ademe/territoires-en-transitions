/** Le rapport : ce que l'import a lu, écrit et écarté, et ce que le recalcul change. */

import type { Dossiers } from './dossiers';
import type { Ecart } from './ecarts';
import type { Valeur } from './tables-grille';

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

/** Affiche les totaux de polluants déclarés remplacés et les dossiers mélangés, sous un titre qui dit s'ils sont prévus ou constatés. */
export const printRecalcul = (
  titre: string,
  {
    totauxRecalcules,
    dossiersMelanges,
  }: {
    totauxRecalcules: readonly Valeur[];
    dossiersMelanges: readonly number[];
  },
  dossiers: Dossiers
) => {
  const pm10 = totauxRecalcules.filter(
    (v) => v.identifiant === 'cae_4.b'
  ).length;
  const parCollectivite = new Map<string, number[]>();
  for (const tecId of dossiersMelanges) {
    const nom = dossiers.get(tecId).collectivite;
    parCollectivite.set(nom, [...(parCollectivite.get(nom) ?? []), tecId]);
  }
  console.log(`\n${titre}`);
  console.log(
    `  total_recalcule : ${totauxRecalcules.length} totaux de polluants déclarés remplacés, dont ${pm10} PM10`
  );
  console.log(
    `  total_melange : ${dossiersMelanges.length} dossiers dans ${parCollectivite.size} collectivités`
  );
  for (const [nom, ids] of [...parCollectivite].sort()) {
    console.log(`    ${nom} : dossiers T&C ${ids.join(', ')}`);
  }
};
