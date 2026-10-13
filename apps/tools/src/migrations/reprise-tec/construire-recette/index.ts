#!/usr/bin/env tsx
/**
 * Reprise T&C, après l'import : la recette, ce que l'outil `/admin/reprise-tec` lit du côté T&C.
 * Les tables `recette_*` sont refaites à chaque passage. Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/construire-recette/index.ts [--confirm]
 */
import { getCible } from '../db';
import { loadCollectivites } from '../import-demarches/collectivites';
import { createCollectivites, createTableCollectivites } from './collectivites';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-construire-recette');
  const client = await pool.connect();

  try {
    const { porteurs } = await loadCollectivites(client);

    await client.query('begin');
    try {
      await createTableCollectivites(client);
      const collectivites = await createCollectivites(client, porteurs);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `recette_collectivite : ${collectivites.ecrites} collectivités, ` +
          `dont ${collectivites.sansTet} sans collectivité TeT`
      );
      console.log(
        isConfirmed ? 'Recette construite.' : 'Simulation : rien n’est écrit.'
      );
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
