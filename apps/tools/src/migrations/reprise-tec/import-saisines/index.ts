#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 4 : saisit les services qui couvrent chaque dossier
 * repris transmis pour avis, comme l'aurait fait sa transmission dans TeT.
 * N'écrit aucun avis. Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-saisines/index.ts [--confirm]
 */
import { getCible } from '../db';
import { loadDossiers } from './dossiers';
import { createSaisines } from './ecriture';
import { validateGardes } from './gardes';
import { printRapport } from './rapport';
import { listSaisines } from './services';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-saisines');
  const client = await pool.connect();

  try {
    const dossiers = await loadDossiers(client);
    const saisines = await listSaisines(pool, dossiers.transmis);
    validateGardes(dossiers, saisines, new Date().toISOString().slice(0, 10));

    await client.query('begin');
    let ecrites: number;
    try {
      ecrites = await createSaisines(client, saisines);
      if (ecrites !== saisines.length) {
        throw new Error(
          `${saisines.length} saisines calculées, ${ecrites} écrites : rien n'est validé.`
        );
      }
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      dossiers: dossiers.transmis,
      saisines,
      ecrites,
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
