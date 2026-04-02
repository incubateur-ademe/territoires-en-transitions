#!/usr/bin/env tsx
/**
 * Fix: met a jour les created_at des sous-actions migrees depuis les etapes
 * pour que le tri created_at ASC respecte l'ordre d'origine des etapes.
 *
 * Usage:  pnpx tsx ./apps/backend/src/plans/fiches/migrations/fix-sous-actions-ordering/fix-sous-actions-ordering.ts
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { groupBy } from 'es-toolkit';
import { Pool } from 'pg';

const BASE_TIMESTAMP = new Date('2026-04-02T00:00:00Z');

interface MappedSousAction {
  sousActionId: number;
  parentId: number;
  ordre: number;
}

export interface FixOrderingResult {
  updated: number;
  errors: Array<{ sousActionId: number; error: string }>;
}

export function computeCreatedAt({
  ordre,
  baseTimestamp,
}: {
  ordre: number;
  baseTimestamp: Date;
}): Date {
  return new Date(baseTimestamp.getTime() + ordre * 1000);
}

export function computeCreatedAtForGroup({
  sousActions,
  baseTimestamp,
}: {
  sousActions: ReadonlyArray<MappedSousAction>;
  baseTimestamp: Date;
}): Array<{ sousActionId: number; createdAt: Date }> {
  return sousActions.map((sa) => ({
    sousActionId: sa.sousActionId,
    createdAt: computeCreatedAt({ ordre: sa.ordre, baseTimestamp }),
  }));
}

export async function runFixSousActionsOrdering(
  db: ReturnType<typeof drizzle>
): Promise<FixOrderingResult> {
  const result: FixOrderingResult = {
    updated: 0,
    errors: [],
  };

  const rows = await db.execute<{
    sous_action_id: number;
    parent_id: number;
    ordre: number;
  }>(sql`
    SELECT
      m.sous_action_id,
      fa.parent_id,
      e.ordre
    FROM migration.etape_to_sous_action m
    JOIN fiche_action_etape e ON e.id = m.etape_id
    JOIN fiche_action fa ON fa.id = m.sous_action_id
    ORDER BY fa.parent_id, e.ordre
  `);

  const sousActions: Array<MappedSousAction> = rows.rows.map((r) => ({
    sousActionId: r.sous_action_id,
    parentId: r.parent_id,
    ordre: r.ordre,
  }));

  const grouped = groupBy(sousActions, (sa) => sa.parentId);
  const groups = Object.entries(grouped);

  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(groups.length / BATCH_SIZE);

  for (let i = 0; i < groups.length; i += BATCH_SIZE) {
    const batchGroups = groups.slice(i, i + BATCH_SIZE);
    const updates = batchGroups.flatMap(([, group]) =>
      computeCreatedAtForGroup({ sousActions: group, baseTimestamp: BASE_TIMESTAMP })
    );
    const ids = updates.map((u) => u.sousActionId);
    const timestamps = updates.map((u) => u.createdAt.toISOString());

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE fiche_action fa
          SET created_at = batch.new_created_at
          FROM unnest(
            ${sql.raw(`ARRAY[${ids.join(',')}]`)}::int[],
            ${sql.raw(`ARRAY[${timestamps.map((t) => `'${t}'`).join(',')}]`)}::timestamptz[]
          ) AS batch(id, new_created_at)
          WHERE fa.id = batch.id
        `);
      });

      result.updated += updates.length;
      console.log(`  Batch ${batchNum}/${totalBatches} : ${batchGroups.length} groupes (${updates.length} sous-actions) corrigees`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Batch ${batchNum}/${totalBatches} : ECHEC - ${message}`);
      result.errors.push(...ids.map((id) => ({ sousActionId: id, error: message })));
    }
  }

  return result;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL requis.\n' +
        'Exemple: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  console.log('🔧 Fix ordering sous-actions...');

  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'fix-sous-actions-ordering',
  });

  const db = drizzle(pool);

  try {
    const result = await runFixSousActionsOrdering(db);

    console.log('\n📊 Resultat :');
    console.log(`   - Sous-actions corrigees : ${result.updated}`);
    if (result.errors.length > 0) {
      console.log(`   - Erreurs : ${result.errors.length}`);
      result.errors.forEach((e) =>
        console.log(`      • Sous-action ${e.sousActionId}: ${e.error}`)
      );
    }
    console.log('\n✅ Fix termine.');
  } catch (error) {
    console.error('❌ Echec :', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes('fix-sous-actions-ordering')) {
  main()
    .then(() => {
      console.log('\n🎉 Fix termine avec succes');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Echec du fix:', err);
      process.exit(1);
    });
}
