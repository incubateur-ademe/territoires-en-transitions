#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 3 : écrit le diagnostic de chaque dossier repris, rangé
 * dans son dossier. Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-diagnostic/index.ts [--confirm]
 */
import { getCible } from '../db';
import { loadTablesGrille } from './tables-grille';
import { loadDossiers } from './dossiers';
import { createEcarts, validateBilan } from './ecarts';
import { createDiagnostics } from './ecriture';
import { validateGardes } from './gardes';
import { printRapport } from './rapport';
import { loadTablesHorsGrille } from './tables-hors-grille';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-diagnostic');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client);
    const tablesGrille = await loadTablesGrille(client, dossiers);
    const tablesHorsGrille = await loadTablesHorsGrille(client, dossiers);
    const ecarts = [...tablesGrille.ecarts, ...tablesHorsGrille.ecarts];

    await validateGardes(client, dossiers, tablesGrille.lignes);
    const bilan = validateBilan(
      [...tablesGrille.lignes, ...tablesHorsGrille.lignes],
      tablesGrille.valeurs,
      ecarts
    );

    await client.query('begin');
    let dossiersEcrits: number;
    try {
      dossiersEcrits = await createDiagnostics(
        client,
        dossiers,
        tablesGrille.valeurs
      );
      await createEcarts(client, ecarts);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      bilan,
      ecarts,
      valeursEcrites: tablesGrille.valeurs.length,
      dossiersEcrits,
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
