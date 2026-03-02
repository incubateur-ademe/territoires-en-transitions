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
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { groupBy } from 'es-toolkit';
import { Pool } from 'pg';

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

  await db.transaction(async (tx) => {
    // Vérifie que la table migration.etape_to_sous_action existe
    const tableExists = await tx.execute<{ exists: boolean }>(sql`
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

    // Récupère toutes les étapes
    const etapes = await tx
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

    const etapesByFicheId = groupBy(etapes, (etape) => etape.ficheId);
    for (const [ficheIdKey, etapes] of Object.entries(etapesByFicheId)) {
      const ficheId = parseInt(ficheIdKey);

      // Récupère le collectiviteId de la fiche parente
      const fiche = await tx
        .select({ collectiviteId: ficheActionTable.collectiviteId })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId))
        .limit(1);

      if (fiche.length === 0) {
        result.errors.push({
          ficheId,
          error: `Fiche parente ${ficheId} introuvable`,
        });
        continue;
      }
      const collectiviteId = fiche[0].collectiviteId;

      // migre chaque étape dans une nouvelle sous-action
      for (const etape of etapes) {
        try {
          // ignore les étapes déjà migrées
          const existing = await tx.execute<{ sous_action_id: number }>(sql`
            SELECT sous_action_id FROM migration.etape_to_sous_action
            WHERE etape_id = ${etape.etapeId}
          `);
          if (existing.rows.length > 0) {
            result.skipped++;
            continue;
          }

          const [sousAction] = await tx
            .insert(ficheActionTable)
            .values({
              collectiviteId,
              parentId: etape.ficheId,
              titre: etape.nom?.trim(),
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
          result.migrated++;
        } catch (err) {
          result.errors.push({
            ficheId,
            etapeId: etape.etapeId,
            error: err instanceof Error ? err.message : String(err),
          });
          return result;
        }
      }
    }
  });

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

  console.log('🚀 Migration étapes → sous-actions...');

  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'migrate-etapes-to-sous-actions',
  });

  const db = drizzle(pool);

  try {
    const result = await runMigrateEtapesToSousActions(db);

    console.log('\n📊 Résultat :');
    console.log(`   - Étapes migrées : ${result.migrated}`);
    console.log(`   - Étapes déjà migrées (ignorées) : ${result.skipped}`);
    if (result.errors.length > 0) {
      console.log(`   - Erreurs : ${result.errors.length}`);
      result.errors.forEach((e) =>
        console.log(`      • Étape ${e.etapeId}: ${e.error}`)
      );
    }
    console.log('\n✅ Migration terminée.');
  } catch (error) {
    console.error('❌ Échec :', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécute la migration uniquement quand le script est lancé directement
if (process.argv[1]?.includes('migrate-etapes-to-sous-actions')) {
  main()
    .then(() => {
      console.log('\n🎉 Migration terminée avec succès');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Échec de la migration:', err);
      process.exit(1);
    });
}
