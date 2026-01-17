#!/usr/bin/env tsx
/**
 * Migration script to move "notes complémentaires" from fiche_action to fiche_action_note
 * with current year and user "Territoires en Transition"
 *
 * Usage: tsx apps/tools/src/migrations/migrate-notes-complementaires.ts
 */

import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_USER_EMAIL = 'system@territoires-en-transitions.fr';
const SYSTEM_USER_NAME = 'Territoires en Transition';

// Get current date
const now = new Date(Date.now());
const MIGRATION_DATE = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

async function main() {
  // Get database URL from environment
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL environment variable is required.\n' +
        'Example: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  console.log(
    '🚀 Starting migration of notes complémentaires to notes de suivi...'
  );

  // Create database connection
  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'migrate-notes-complementaires',
  });

  const db = drizzle(pool);

  try {
    await db.transaction(async (tx) => {
      // Step 1: Create or get the system user "Territoires en Transition"
      console.log('📝 Step 1: Creating or getting system user...');

      // First, try to find existing user by email
      let systemUserId: string;
      const existingUser = await tx
        .select({ id: authUsersTable.id })
        .from(authUsersTable)
        .where(eq(authUsersTable.email, SYSTEM_USER_EMAIL))
        .limit(1);

      if (existingUser.length > 0) {
        systemUserId = existingUser[0].id;
        console.log(
          `   ✅ System user "${SYSTEM_USER_NAME}" already exists with id ${systemUserId}`
        );
      } else {
        console.log('   Creating new system user...');
        const newUser = await tx
          .insert(authUsersTable)
          .values({
            id: SYSTEM_USER_ID,
            instanceId: '00000000-0000-0000-0000-000000000000',
            aud: 'authenticated',
            role: 'authenticated',
            email: SYSTEM_USER_EMAIL,
            /**
             * SECURITY NOTE: This is an invalid bcrypt hash that cannot match any password.
             * The account is locked via multiple mechanisms:
             * 1. emailConfirmedAt is null (email not verified)
             * 2. bannedUntil is set to far future
             * 3. Password hash is intentionally invalid
             * This system account is used ONLY for data attribution and cannot be used for login.
             */
            encryptedPassword: '!!LOCKED:SYSTEM_ACCOUNT:NO_LOGIN_ALLOWED!!',
            emailConfirmedAt: null,
            bannedUntil: '2099-12-31T23:59:59Z', // Permanently banned
            confirmationToken: '',
            recoveryToken: '',
            emailChangeTokenNew: '',
            emailChange: '',
            rawAppMetaData: {
              provider: 'system',
              providers: ['system'],
              is_system_account: true,
              login_disabled: true,
            },
            rawUserMetaData: {
              nom: SYSTEM_USER_NAME,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            phone: null,
            phoneChange: '',
            phoneChangeToken: '',
            emailChangeTokenCurrent: '',
            emailChangeConfirmStatus: 0,
            reauthenticationToken: '',
            isSsoUser: false,
            isAnonymous: false,
          })
          .returning({ id: authUsersTable.id });

        systemUserId = newUser[0].id;
        console.log(
          `   ✅ Created system user "${SYSTEM_USER_NAME}" with id ${systemUserId}`
        );

        // Create corresponding dcp entry only if user was just created
        await tx.insert(dcpTable).values({
          id: systemUserId,
          email: SYSTEM_USER_EMAIL,
          prenom: 'Territoires',
          nom: 'en Transition',
          cguAccepteesLe: new Date().toISOString(),
          limited: false,
          deleted: false,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        });
      }

      // Step 2: Get all fiches with non-empty notes_complementaires
      console.log('📝 Step 2: Finding fiches with notes complémentaires...');

      const fichesWithNotes = await tx.execute<{
        id: number;
        notes_complementaires: string;
        created_at: string;
        modified_at: string;
      }>(sql`
        SELECT id, notes_complementaires, created_at, modified_at
        FROM fiche_action
        WHERE notes_complementaires IS NOT NULL
          AND TRIM(notes_complementaires) != ''
      `);

      console.log(
        `   Found ${fichesWithNotes.rows.length} fiches with notes complémentaires`
      );

      if (fichesWithNotes.rows.length === 0) {
        console.log('✅ No fiches to migrate');
        return;
      }

      // Step 3: Migrate notes and clear notes_complementaires
      console.log(
        '📝 Step 3: Migrating notes and clearing notes_complementaires...'
      );
      let migratedCount = 0;

      for (const fiche of fichesWithNotes.rows) {
        const trimmedNote = (fiche.notes_complementaires || '').trim();
        if (!trimmedNote) {
          continue;
        }

        // Insert or update note (handles existing notes)
        await tx.insert(ficheActionNoteTable).values({
          ficheId: fiche.id,
          dateNote: MIGRATION_DATE,
          note: trimmedNote,
          createdBy: systemUserId,
          modifiedBy: systemUserId,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        });

        // Clear notes_complementaires after successful migration
        await tx.execute(
          sql`UPDATE fiche_action SET notes_complementaires = NULL WHERE id = ${fiche.id}`
        );

        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(
            `   Progress: ${migratedCount}/${fichesWithNotes.rows.length}...`
          );
        }
      }

      console.log(
        `   ✅ Migrated ${migratedCount} notes and cleared notes_complementaires`
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
