#!/usr/bin/env tsx
/**
 * Migration script : copie toutes les étapes existantes d'une FA sous forme de sous-actions
 *
 * - Crée une sous-action (fiche avec parent_id = fiche_id) pour chaque étape
 * - Utilise migration.etape_to_sous_action pour éviter les doublons (idempotence)
 * - Mapping : nom étape → titre sous-action, realise → statut "Réalisé" ou "À venir"
 * - createdBy, modifiedBy, createdAt, modifiedAt de l'étape → champs associés de la sous-action
 *
 * Usage:  pnpx tsx ./apps/backend/src/plans/fiches/migrations/migrate-etapes-to-sous-actions/migrate-etapes-to-sous-actions.ts
 */

import { ficheActionEtapeTable } from '@tet/backend/plans/fiches/fiche-action-etape/fiche-action-etape.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { StatutEnum } from '@tet/domain/plans';
import { inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const BATCH_SIZE = 100;

export interface MigrationEtapesResult {
  migrated: number;
  skipped: number;
  errors: Array<{ ficheId: number; etapeId?: number; error: string }>;
}

export async function runMigrateEtapesToSousActions(
  db: ReturnType<typeof drizzle>
): Promise<MigrationEtapesResult> {
  const result: MigrationEtapesResult = {
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  // Pre-check migration table exists
  const tableExists = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'migration'
        AND table_name = 'etape_to_sous_action'
    ) as exists
  `);
  if (!tableExists.rows[0]?.exists) {
    throw new Error(
      "La table migration.etape_to_sous_action n'existe pas. Exécutez d'abord la migration Sqitch : sqitch deploy migration/etape_to_sous_action"
    );
  }

  // Fetch all étapes
  const allEtapes = await db
    .select({
      etapeId: ficheActionEtapeTable.id,
      ficheId: ficheActionEtapeTable.ficheId,
      nom: ficheActionEtapeTable.nom,
      realise: ficheActionEtapeTable.realise,
      createdBy: ficheActionEtapeTable.createdBy,
      modifiedBy: ficheActionEtapeTable.modifiedBy,
      createdAt: ficheActionEtapeTable.createdAt,
      modifiedAt: ficheActionEtapeTable.modifiedAt,
    })
    .from(ficheActionEtapeTable)
    .orderBy(ficheActionEtapeTable.ficheId, ficheActionEtapeTable.ordre);

  console.log(`${allEtapes.length} étapes trouvées`);

  // Fetch already-migrated étapes in bulk
  const alreadyMigrated = await db.execute<{ etape_id: number }>(sql`
    SELECT etape_id FROM migration.etape_to_sous_action
  `);
  const migratedIds = new Set(alreadyMigrated.rows.map((r) => r.etape_id));

  // Filter out already-migrated
  const etapesToMigrate = allEtapes.filter((e) => {
    if (migratedIds.has(e.etapeId)) {
      result.skipped++;
      return false;
    }
    return true;
  });

  console.log(
    `${etapesToMigrate.length} à migrer, ${result.skipped} déjà migrées`
  );

  if (etapesToMigrate.length === 0) {
    return result;
  }

  // Fetch all collectiviteIds in bulk
  const ficheIds = [...new Set(etapesToMigrate.map((e) => e.ficheId))];
  const fiches = await db
    .select({
      id: ficheActionTable.id,
      collectiviteId: ficheActionTable.collectiviteId,
    })
    .from(ficheActionTable)
    .where(inArray(ficheActionTable.id, ficheIds));

  const collectiviteByFicheId = new Map(
    fiches.map((f) => [f.id, f.collectiviteId])
  );

  // Process in batches
  const totalBatches = Math.ceil(etapesToMigrate.length / BATCH_SIZE);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batch = etapesToMigrate.slice(
      batchIdx * BATCH_SIZE,
      (batchIdx + 1) * BATCH_SIZE
    );

    console.log(
      `Batch ${batchIdx + 1}/${totalBatches} (${batch.length} étapes)...`
    );

    await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL ROLE postgres`);

      for (const etape of batch) {
        const collectiviteId = collectiviteByFicheId.get(etape.ficheId);
        if (collectiviteId === undefined) {
          result.errors.push({
            ficheId: etape.ficheId,
            etapeId: etape.etapeId,
            error: `Fiche parente ${etape.ficheId} introuvable`,
          });
          continue;
        }

        try {
          await tx.execute(sql`SAVEPOINT sp_etape`);

          const fullTitle = etape.nom?.trim();
          const isTruncated = fullTitle && fullTitle.length > 300;

          const [sousAction] = await tx
            .insert(ficheActionTable)
            .values({
              collectiviteId,
              parentId: etape.ficheId,
              titre: fullTitle?.slice(0, 300),
              description: isTruncated ? fullTitle : undefined,
              statut: etape.realise ? StatutEnum.REALISE : StatutEnum.A_VENIR,
              createdBy: etape.createdBy,
              modifiedBy: etape.modifiedBy,
              createdAt: etape.createdAt,
              modifiedAt: etape.modifiedAt,
            })
            .returning({ id: ficheActionTable.id });

          await tx.execute(sql`
            INSERT INTO migration.etape_to_sous_action (etape_id, sous_action_id)
            VALUES (${etape.etapeId}, ${sousAction.id})
          `);

          await tx.execute(sql`RELEASE SAVEPOINT sp_etape`);
          result.migrated++;
        } catch (err) {
          await tx.execute(sql`ROLLBACK TO SAVEPOINT sp_etape`);
          if (result.errors.length === 0) {
            console.error('Premiere erreur (details complets):', err);
          }
          result.errors.push({
            ficheId: etape.ficheId,
            etapeId: etape.etapeId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    });

    console.log(
      `  -> ${result.migrated} migrées, ${result.errors.length} erreurs`
    );
  }

  return result;
}

async function main() {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL requis.\n' +
        'Exemple: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  console.log('Migration étapes -> sous-actions...');

  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'migrate-etapes-to-sous-actions',
  });

  const db = drizzle(pool);

  try {
    const result = await runMigrateEtapesToSousActions(db);

    console.log('\nResultat :');
    console.log(`   - Etapes migrees : ${result.migrated}`);
    console.log(`   - Etapes deja migrees (ignorees) : ${result.skipped}`);
    if (result.errors.length > 0) {
      console.log(`   - Erreurs : ${result.errors.length}`);
      [result.errors[0]].forEach((e) =>
        console.log(`      Etape ${e.etapeId}: ${e.error}`)
      );
    }
    console.log('\nMigration terminee.');
  } catch (error) {
    console.error('Echec :', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes('migrate-etapes-to-sous-actions')) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Echec de la migration:', err);
      process.exit(1);
    });
}
