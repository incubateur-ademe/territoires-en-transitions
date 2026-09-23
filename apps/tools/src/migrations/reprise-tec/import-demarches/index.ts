#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 2 : écrit les dossiers dans `demarche`.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-demarches/index.ts \
 *     --suivi chemin/vers/suivi-ademe.csv [--confirm]
 */

import { getCible } from '../db';
import { buildDossier, Dossier } from './dossier';
import { createDossiers } from './ecriture';
import { listElaborationsRemplacees } from './elaborations-remplacees';
import { validateCollectivites } from './gardes';
import { getSuiviAdeme, listLignesDemarche, listPorteurs } from './lecture';
import { calculatePerimetre, Motif } from './perimetre';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const suivi = getSuiviAdeme(getArgument('--suivi'));
  const pool = getCible('reprise-tec-import-demarches');
  const client = await pool.connect();

  try {
    const lignes = await listLignesDemarche(client);
    const porteurs = await listPorteurs(client);

    const { retenues, ecartees } = calculatePerimetre(lignes);
    const dossiers = retenues.map((ligne) =>
      buildDossier(ligne, porteurs.get(ligne.id), suivi)
    );

    validateCollectivites(dossiers, porteurs);

    const elaborationsRemplacees = listElaborationsRemplacees(dossiers);
    const dossiersAImporter = dossiers.filter(
      (d) => !elaborationsRemplacees.includes(d.tecId)
    );

    await client.query('begin');
    try {
      await createDossiers(client, dossiersAImporter);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printComptes(
      lignes.length,
      ecartees,
      elaborationsRemplacees,
      dossiersAImporter,
      isConfirmed
    );
  } finally {
    client.release();
    await pool.end();
  }
};

/** La valeur qui suit une option de la ligne de commande ; erreur si elle manque. */
const getArgument = (nom: string) => {
  const valeur = process.argv[process.argv.indexOf(nom) + 1];
  if (!process.argv.includes(nom) || !valeur) {
    throw new Error(`${nom} est requis.`);
  }
  return valeur;
};

/** Affiche ce qui a été lu, écarté par motif, et écrit par statut. */
const printComptes = (
  lues: number,
  ecartees: { motif: Motif }[],
  elaborationsRemplacees: number[],
  ecrits: Dossier[],
  isConfirmed: boolean
) => {
  const compter = (valeurs: string[]) =>
    [...new Set(valeurs)]
      .sort()
      .map((v) => `${v} : ${valeurs.filter((x) => x === v).length}`);

  console.log(`${lues} lignes de dossier lues dans T&C`);
  for (const ligne of compter(ecartees.map((e) => e.motif))) {
    console.log(`  écartées, ${ligne}`);
  }
  console.log(
    `  écartées, élaboration remplacée par une plus récente : ${elaborationsRemplacees.length}`
  );
  console.log(`${ecrits.length} dossiers écrits`);
  for (const ligne of compter(ecrits.map((d) => d.colonnes.status))) {
    console.log(`  ${ligne}`);
  }
  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
