/** Le rapport : ce que l'import a lu, écrit et écarté, et les cas à connaître. */

import { buildNomPlan } from './plans';
import type { Dossier } from './dossiers';
import type { Ecart } from './ecarts';
import type { Fiche } from './fiches';
import type { ListesTet } from './listes-tet';
import { listSecteursThematiques } from './listes-tec';
import type { Tags } from './tags';

/** Affiche le bilan par table, les écarts, ce qui est écrit, les classements sans sous-thématique et les cas nommés. */
export const printRapport = ({
  bilan,
  ecarts,
  dossiers,
  fiches,
  listesTet,
  tags,
  definitifsAvecPlusDActions,
  isConfirmed,
}: {
  bilan: { table: string; lues: number; ecrites: number; ecartees: number }[];
  ecarts: readonly Ecart[];
  dossiers: readonly Dossier[];
  fiches: readonly Fiche[];
  listesTet: ListesTet;
  tags: Tags['comptes'];
  definitifsAvecPlusDActions: readonly string[];
  isConfirmed: boolean;
}) => {
  const liens = (lister: (f: Fiche) => readonly unknown[]) =>
    fiches.reduce((n, f) => n + lister(f).length, 0);
  const classements = dossiers
    .flatMap((d) =>
      d.actions.flatMap((a) => listSecteursThematiques(a.secteurs))
    )
    .map(listesTet.getClassement);

  console.log('Lignes de T&C, par table : lues = écrites + écartées');
  for (const b of bilan) {
    console.log(`  ${b.table} : ${b.lues} = ${b.ecrites} + ${b.ecartees}`);
  }
  console.log('Écarts par motif');
  printComptes(
    ecarts.filter((e) => e.motif !== 'sans_place').map((e) => e.motif)
  );
  console.log('Parties de ligne écartées (sans place dans une fiche)');
  printComptes(
    ecarts.filter((e) => e.motif === 'sans_place').map((e) => e.precision)
  );

  console.log(
    `\n${dossiers.length} plans, un par dossier repris qui porte des actions`
  );
  console.log(`${fiches.length} fiches, toutes « À venir »`);
  console.log(`  ${liens((f) => f.effetIds)} effets attendus`);
  console.log(`  ${liens((f) => f.thematiqueIds)} thématiques`);
  console.log(`  ${liens((f) => f.sousThematiqueIds)} sous-thématiques`);
  console.log(`  ${liens((f) => f.structures)} structures pilotes`);
  console.log(`  ${liens((f) => f.tagsLibres)} tags personnalisés`);
  console.log(`  ${liens((f) => f.notes)} notes`);
  console.log(
    `  ${
      fiches.filter((f) => f.secteursReglementaires.length > 0).length
    } fiches avec des secteurs réglementaires (${liens(
      (f) => f.secteursReglementaires
    )} secteurs)`
  );
  console.log(
    `Structures pilotes : ${tags.structure_tag.reutilises} réutilisées, ${tags.structure_tag.crees} créées`
  );
  console.log(
    `Tags personnalisés : ${tags.libre_tag.reutilises} réutilisés, ${tags.libre_tag.crees} créés`
  );

  console.log(`\nClassements par secteur : ${classements.length}`);
  console.log(
    `  avec une sous-thématique : ${
      classements.filter((c) => c.sousThematiqueId !== null).length
    }`
  );
  console.log(
    `  sans sous-thématique, filtre perdu : ${
      classements.filter(
        (c) => c.sousThematiqueId === null && !c.thematiqueExacte
      ).length
    }`
  );
  console.log(
    `  sans sous-thématique, thématique du même sens : ${
      classements.filter((c) => c.thematiqueExacte).length
    }`
  );

  printCas(
    "Dossiers dont le doublon « définitif » portait plus d'actions",
    definitifsAvecPlusDActions
  );
  printCas(
    'Collectivités à deux plans du même nom',
    listPlansHomonymes(dossiers)
  );

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

/** Les collectivités qui reçoivent deux plans ou plus du même nom (deux dossiers lancés la même année). */
const listPlansHomonymes = (dossiers: readonly Dossier[]) => {
  const parNom = new Map<string, Dossier[]>();
  for (const d of dossiers) {
    const cle = `${d.collectivite} : « ${buildNomPlan(d)} »`;
    parNom.set(cle, [...(parNom.get(cle) ?? []), d]);
  }
  return [...parNom]
    .filter(([, memes]) => memes.length > 1)
    .map(
      ([cle, memes]) =>
        `${cle}, dossiers T&C ${memes.map((d) => d.tecId).join(', ')}`
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
