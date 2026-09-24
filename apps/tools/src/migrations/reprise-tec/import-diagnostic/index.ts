#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 3 : écrit le diagnostic de chaque dossier repris, rangé
 * dans son dossier. Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-diagnostic/index.ts [--confirm]
 */
import { getCible } from '../db';
import { loadDiagnostic } from './diagnostic';
import { loadDossiers } from './dossiers';
import { createDiagnostics } from './ecriture';
import { printRapport } from './rapport';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-diagnostic');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client);
    const { lignes, valeurs } = await loadDiagnostic(client);

    await client.query('begin');
    let dossiersEcrits: number;
    try {
      dossiersEcrits = await createDiagnostics(client, dossiers, valeurs);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({ lignes, valeurs, dossiersEcrits, isConfirmed });
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
