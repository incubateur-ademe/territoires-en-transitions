#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 7 : les pilotes des dossiers et des fiches de T&C deviennent des noms sans compte (personne_tag) de la collectivité.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pilotes/index.ts [--confirm]
 */
import { getCible } from '../db';
import { createPilotesDossiers, createPilotesFiches } from './ecriture';
import { createPersonneTags } from './personne-tag';
import { loadPilotes } from './pilotes';
import { printRapport } from './rapport';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-import-pilotes');
  const client = await pool.connect();

  try {
    const pilotes = await loadPilotes(client);

    await client.query('begin');
    try {
      const personneTags = await createPersonneTags(client, [
        ...pilotes.dossiers,
        ...pilotes.fiches,
      ]);
      const pilotesDossiers = await createPilotesDossiers(
        client,
        pilotes.dossiers,
        personneTags
      );
      const pilotesFiches = await createPilotesFiches(
        client,
        pilotes.fiches,
        personneTags
      );
      await client.query(isConfirmed ? 'commit' : 'rollback');

      printRapport({
        personneTags,
        pilotesDossiers,
        pilotesFiches,
        isConfirmed,
      });
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
