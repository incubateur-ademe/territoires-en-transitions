#!/usr/bin/env tsx
/**
 * Migration script to ingest instance_gouvernance_migration_output.csv
 *
 * For each row:
 * - If tags is not empty: split by "," and create tags in instance_de_gouvernance table
 * - If additional_description is not empty: append to existing description for the ficheId
 *
 * Usage: tsx apps/tools/src/migrations/ingest-instance-gouvernance-migration-output.ts
 */
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance.table';
import { ficheActionInstanceGouvernanceTableTag } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYSTEM_USER_EMAIL = 'system@territoires-en-transitions.fr';
const SYSTEM_USER_NAME = 'Territoires en Transition';

interface CSVRow {
  ficheId: number;
  collectiviteId: number;
  tags: string;
  additional_description: string;
}

/**
 * Parse a CSV line with proper handling of quoted fields
 */
function parseCSVLine(
  content: string,
  startIndex: number
): { fields: string[]; nextIndex: number } {
  const fields: string[] = [];
  let currentField = '';
  let i = startIndex;
  let inQuotes = false;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote)
        currentField += '"';
        i += 2;
      } else if (
        inQuotes &&
        (nextChar === ';' || nextChar === '\n' || i === content.length - 1)
      ) {
        // End of quoted field
        inQuotes = false;
        i++;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ';' && !inQuotes) {
      // Field separator (only outside quotes)
      fields.push(currentField.trim());
      currentField = '';
      i++;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of line (only outside quotes)
      if (char === '\r' && nextChar === '\n') {
        i += 2; // Skip \r\n
      } else {
        i++;
      }
      break;
    } else {
      currentField += char;
      i++;
    }
  }

  // Add the last field
  if (currentField.length > 0 || fields.length > 0) {
    fields.push(currentField.trim());
  }

  return { fields, nextIndex: i };
}

/**
 * Parse CSV file and return array of rows
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows: CSVRow[] = [];
  let index = 0;
  let lineNumber = 0;

  // Skip header row
  const headerResult = parseCSVLine(content, index);
  index = headerResult.nextIndex;
  lineNumber++;

  // Parse data rows
  while (index < content.length) {
    // Skip empty lines
    while (
      index < content.length &&
      (content[index] === '\n' || content[index] === '\r')
    ) {
      if (content[index] === '\r' && content[index + 1] === '\n') {
        index += 2;
      } else {
        index++;
      }
    }

    if (index >= content.length) {
      break;
    }

    const result = parseCSVLine(content, index);
    const fields = result.fields;
    index = result.nextIndex;
    lineNumber++;

    // Skip empty rows
    if (fields.length === 0 || fields.every((f) => f.trim() === '')) {
      continue;
    }

    // Format: ficheId;collectiviteId;tags;additional_description
    const ficheIdStr = fields[0] || '';
    const collectiviteIdStr = fields[1] || '';
    const tags = fields[2] || '';
    const additional_description = fields[3] || '';

    const ficheId = parseInt(ficheIdStr, 10);
    const collectiviteId = parseInt(collectiviteIdStr, 10);

    if (isNaN(ficheId) || isNaN(collectiviteId)) {
      console.warn(
        `⚠️  Skipping invalid row at line ${lineNumber}: ficheId=${ficheIdStr}, collectiviteId=${collectiviteIdStr}`
      );
      continue;
    }

    rows.push({
      ficheId,
      collectiviteId,
      tags,
      additional_description,
    });
  }

  return rows;
}

/**
 * Split tags string by comma and trim each tag
 */
function splitTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr.trim() === '') {
    return [];
  }
  return tagsStr
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

async function main() {
  // Get database URL from environment
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL environment variable is required.\n' +
        'Example: export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  // Get CSV file path
  const csvPath = path.join(
    __dirname,
    'instance_gouvernance_migration_output.csv'
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  console.log('📖 Reading CSV file...');
  const rows = parseCSV(csvPath);
  console.log(`   Found ${rows.length} rows`);

  // Create database connection
  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'ingest-instance-gouvernance-migration-output',
  });

  const db = drizzle(pool);

  try {
    await db.transaction(async (tx) => {
      // Step 1: Create or get the system user
      console.log('📝 Step 1: Creating or getting system user...');

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
            encryptedPassword: '!!LOCKED:SYSTEM_ACCOUNT:NO_LOGIN_ALLOWED!!',
            emailConfirmedAt: null,
            bannedUntil: '2099-12-31T23:59:59Z',
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

        // Create corresponding dcp entry
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

      // Step 2: Process each row
      console.log('📝 Step 2: Processing rows...');
      let processedCount = 0;
      let tagsCreatedCount = 0;
      let tagsLinkedCount = 0;
      let descriptionsUpdatedCount = 0;

      for (const row of rows) {
        const {
          ficheId,
          collectiviteId,
          tags: tagsStr,
          additional_description,
        } = row;

        // Verify fiche exists
        const ficheExists = await tx
          .select({ id: ficheActionTable.id })
          .from(ficheActionTable)
          .where(eq(ficheActionTable.id, ficheId))
          .limit(1);

        if (ficheExists.length === 0) {
          console.warn(`⚠️  Fiche ${ficheId} not found, skipping row`);
          processedCount++;
          continue;
        }

        // Process tags if not empty
        if (tagsStr && tagsStr.trim() !== '') {
          const tagNames = splitTags(tagsStr);
          // Deduplicate tags within the same row
          const uniqueTagNames = [...new Set(tagNames)];

          for (const tagName of uniqueTagNames) {
            // Find or create instance gouvernance tag
            const existingTag = await tx
              .select()
              .from(instanceGouvernanceTagTable)
              .where(
                and(
                  eq(instanceGouvernanceTagTable.nom, tagName),
                  eq(instanceGouvernanceTagTable.collectiviteId, collectiviteId)
                )
              )
              .limit(1);

            let tagId: number;

            if (existingTag.length > 0) {
              tagId = existingTag[0].id;
            } else {
              // Create new tag
              const [newTag] = await tx
                .insert(instanceGouvernanceTagTable)
                .values({
                  nom: tagName,
                  collectiviteId: collectiviteId,
                  createdBy: systemUserId,
                })
                .returning();
              tagId = newTag.id;
              tagsCreatedCount++;
            }

            // Link tag to fiche_action if not already linked
            const existingLink = await tx
              .select()
              .from(ficheActionInstanceGouvernanceTableTag)
              .where(
                and(
                  eq(ficheActionInstanceGouvernanceTableTag.ficheId, ficheId),
                  eq(
                    ficheActionInstanceGouvernanceTableTag.instanceGouvernanceTagId,
                    tagId
                  )
                )
              )
              .limit(1);

            if (existingLink.length === 0) {
              await tx.insert(ficheActionInstanceGouvernanceTableTag).values({
                ficheId: ficheId,
                instanceGouvernanceTagId: tagId,
                createdBy: systemUserId,
              });
              tagsLinkedCount++;
            }
          }
        }

        // Process additional_description if not empty
        if (additional_description && additional_description.trim() !== '') {
          // Get current description
          const currentFiche = await tx
            .select({ description: ficheActionTable.description })
            .from(ficheActionTable)
            .where(eq(ficheActionTable.id, ficheId))
            .limit(1);

          if (currentFiche.length > 0) {
            const currentDescription = currentFiche[0].description || '';
            const textToAppend = `\n\n Instance de gouvernance : \n ${additional_description.trim()}`;
            const newDescription = currentDescription
              ? `${currentDescription}${textToAppend}`
              : textToAppend;

            // Update description (limit to 20000 chars as per schema)
            const truncatedDescription = newDescription.substring(0, 20000);

            await tx
              .update(ficheActionTable)
              .set({
                description: truncatedDescription,
                modifiedBy: systemUserId,
              })
              .where(eq(ficheActionTable.id, ficheId));

            descriptionsUpdatedCount++;
          }
        }

        processedCount++;

        if (processedCount % 100 === 0) {
          console.log(`   Progress: ${processedCount}/${rows.length}...`);
        }
      }

      console.log(`   ✅ Processed ${processedCount} rows`);
      console.log(`   📊 Statistics:`);
      console.log(`      - Tags created: ${tagsCreatedCount}`);
      console.log(`      - Tags linked to fiches: ${tagsLinkedCount}`);
      console.log(`      - Descriptions updated: ${descriptionsUpdatedCount}`);
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
