#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 2 : écrit les dossiers dans `demarche`.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-demarches/index.ts \
 *     --suivi chemin/vers/suivi-ademe.csv --date-reference AAAA-MM-JJ [--confirm]
 */

import { getCible } from '../db';
import { loadCollectivites } from './collectivites';
import { loadDemarchesTet } from './demarches-tet';
import { buildDossier } from './dossier';
import { createDossiers } from './ecriture';
import { listElaborationsRemplacees } from './elaborations-remplacees';
import { validateGardes } from './gardes';
import { loadPerimetre } from './perimetre';
import { printRapport } from './rapport';
import { readSuiviAdeme } from './suivi-ademe';
import { getArgument, getDateReference } from './utils';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const suivi = readSuiviAdeme(getArgument('--suivi'));
  const dateReference = getDateReference();
  const pool = getCible('reprise-tec-import-demarches');
  const client = await pool.connect();

  try {
    const perimetre = await loadPerimetre(client);
    const collectivites = await loadCollectivites(client);
    const demarchesTet = await loadDemarchesTet(client);

    const dossiers = perimetre.retenues.map((ligne) =>
      buildDossier(ligne, collectivites.getPorteur(ligne.id), suivi)
    );

    const elaborationsRemplacees = listElaborationsRemplacees(dossiers);
    const dossiersAImporter = dossiers.filter(
      (d) => !elaborationsRemplacees.includes(d.tecId)
    );

    validateGardes(dossiersAImporter, {
      collectivites,
      demarchesTet,
      dateReference,
    });

    await client.query('begin');
    try {
      await createDossiers(client, dossiersAImporter);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      lues: perimetre.lues,
      ecartees: perimetre.ecartees,
      elaborationsRemplacees,
      ecrits: dossiersAImporter,
      deuxDossiersEnCours: demarchesTet.listDeuxDossiersEnCours(
        dossiersAImporter,
        collectivites
      ),
      isConfirmed,
    });
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
