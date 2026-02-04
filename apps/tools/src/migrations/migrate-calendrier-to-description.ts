#!/usr/bin/env tsx
/**
 * Migration script to move "calendrier" field from fiche_action to description field
 * Prepends "Éléments de calendrier : " to the description for fiches with filled calendrier
 *
 * Usage: tsx apps/tools/src/migrations/migrate-calendrier-to-description.ts
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const PREFIX = 'Éléments de calendrier : ';

async function main() {
  // Get database URL from environment
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL environment variable is required.\n' +
        'Example: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  console.log('🚀 Starting migration of calendrier field to description...');

  // Create database connection
  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'migrate-calendrier-to-description',
  });

  const db = drizzle(pool);

  try {
    await db.transaction(async (tx) => {
      // Step 1: Get all fiches with non-empty calendrier
      console.log('📝 Step 1: Finding fiches with calendrier field...');

      const fichesWithCalendrier = await tx.execute<{
        id: number;
        calendrier: string;
        description: string | null;
      }>(sql`
        SELECT id, calendrier, description
        FROM fiche_action
        WHERE calendrier IS NOT NULL
          AND TRIM(calendrier) != ''
      `);

      console.log(
        `   Found ${fichesWithCalendrier.rows.length} fiches with calendrier field`
      );

      if (fichesWithCalendrier.rows.length === 0) {
        console.log('✅ No fiches to migrate');
        return;
      }

      // Step 2: Migrate calendrier to description
      console.log('📝 Step 2: Migrating calendrier to description field...');
      let migratedCount = 0;

      for (const fiche of fichesWithCalendrier.rows) {
        const trimmedCalendrier = (fiche.calendrier || '').trim();
        if (!trimmedCalendrier) {
          continue;
        }

        // Build new description
        const calendrierText = `${PREFIX}${trimmedCalendrier}`;
        let newDescription: string;

        if (fiche.description && fiche.description.trim() !== '') {
          // Description exists, append calendrier with a space
          newDescription = `${fiche.description} ${calendrierText}`;
        } else {
          // No description, use calendrier text as description
          newDescription = calendrierText;
        }

        // Update description field
        await tx.execute(
          sql`
            UPDATE fiche_action
            SET description = ${newDescription}
            WHERE id = ${fiche.id}
          `
        );

        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(
            `   Progress: ${migratedCount}/${fichesWithCalendrier.rows.length}...`
          );
        }
      }

      console.log(
        `   ✅ Migrated ${migratedCount} calendrier fields to description`
      );
    });

    console.log(`\n✅ Migration completed!`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
main()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
