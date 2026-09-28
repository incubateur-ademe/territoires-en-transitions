#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 3 : relance le recalcul des totaux après un import
 * confirmé, par exemple si l'appel au backend a échoué en cours de route.
 * Rejouable : les écarts du recalcul sont réinscrits à neuf.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." TET_API_URL="https://..." \
 *   TET_API_TOKEN="<service role>" pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-diagnostic/recalculer.ts
 */

import { getCible } from '../db';
import { loadDossiers } from './dossiers';
import { lancerRecalcul } from './recalcul';
import { printRecalcul } from './rapport';
import { loadTablesGrille } from './tables-grille';

const main = async () => {
  const pool = getCible('reprise-tec-recalculer-diagnostic');
  const client = await pool.connect();

  try {
    const {
      rows: [{ importes }],
    } = await client.query<{ importes: number }>(
      `select count(*)::int as importes from reprise_tec.correspondance
        where table_cible = 'indicateur_source_metadonnee'`
    );
    if (importes === 0) {
      throw new Error(
        "Aucun diagnostic importé : lancer d'abord index.ts --confirm."
      );
    }
    const dossiers = await loadDossiers(client);
    const { valeurs } = await loadTablesGrille(client, dossiers);
    const recalcul = await lancerRecalcul(client, dossiers, valeurs);
    printRecalcul('Constaté après le recalcul', recalcul, dossiers);
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
