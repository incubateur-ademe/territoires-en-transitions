#!/usr/bin/env tsx
/**
 * Import Banatic 2025 codes from 1_code_banatic_2025.csv into banatic_2025_competence.
 *
 * CSV columns: Libellé Catégorie, Code Compétence, Intitulé BANATIC, ...
 * Rows without a valid Code Compétence (e.g. C1005) are skipped.
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-codes/index.ts [path/to/1_code_banatic_2025.csv]
 *
 * Default path: ~/Downloads/source_banatic_2025/1_code_banatic_2025.csv
 */

import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { z } from 'zod';
import { getCsvPathFromArgv, parseCsvRecords, readCsvFile } from '../csv';
import { getDatabase } from '../db';

const codeCompetenceSchema = z
  .string()
  .trim()
  .regex(/^C\d{4}$/, 'Code must be C followed by 4 digits (e.g. C1005)');

const csvRowSchema = z.object({
  codeCompetence: codeCompetenceSchema,
  intituleBanatic: z.string().trim().min(1, 'Intitulé BANATIC is required'),
});

type CsvRow = z.infer<typeof csvRowSchema>;

const CSV_COLUMNS = {
  code: 'Code Compétence',
  intitule: 'Intitulé BANATIC',
} as const;

/** Extract code and intitulé from a csv-parse record. */
const recordToRaw = (
  record: Record<string, string>
): { codeCompetence: string; intituleBanatic: string } | null => {
  const code = (record[CSV_COLUMNS.code] ?? '').trim();
  const intitule = (record[CSV_COLUMNS.intitule] ?? '').trim();

  if (!code || !intitule) return null;
  return { codeCompetence: code, intituleBanatic: intitule };
};

/** Convert code string (C1005) to integer (1005). */
const codeToInteger = (code: string): number => {
  const match = code.match(/^C(\d{4})$/);
  if (!match || match[1] == null) throw new Error(`Invalid code: ${code}`);
  return parseInt(match[1], 10);
};

/** Map validated CSV row to DB row. Pure. */
const toDbRow = (row: CsvRow) => ({
  competenceCode: codeToInteger(row.codeCompetence),
  intitule: row.intituleBanatic,
});

/** Parse file content into validated CsvRow[]; invalid rows are skipped with a warn. */
const contentToRows = (content: string): CsvRow[] =>
  parseCsvRecords(content).flatMap((record, i) => {
    const raw = recordToRaw(record);
    if (!raw) return [];
    const result = csvRowSchema.safeParse(raw);
    if (result.success) return [result.data];
    console.warn(
      `⚠️  Line ${i + 2}: skip (${
        raw.codeCompetence
      } / ${raw.intituleBanatic.slice(0, 30)}...): ${result.error.message}`
    );
    return [];
  });

const USAGE =
  'tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-codes/index.ts [path/to/1_code_banatic_2025.csv]';

async function main() {
  const csvPath = getCsvPathFromArgv(2, USAGE);
  const fileContent = readCsvFile(csvPath);

  console.log('📂 Parsing CSV:', csvPath);
  const rows = contentToRows(fileContent);
  console.log(`   Found ${rows.length} valid rows (code + intitulé).`);

  if (rows.length === 0) {
    console.log('Nothing to import.');
    return;
  }

  const { db, pool } = getDatabase('import-banatic-2025-codes');
  type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
  const upsertRow = (tx: Tx, row: CsvRow) =>
    tx
      .insert(banatic2025CompetenceTable)
      .values(toDbRow(row))
      .onConflictDoUpdate({
        target: [banatic2025CompetenceTable.competenceCode],
        set: { intitule: row.intituleBanatic },
      });

  try {
    await db.transaction(async (tx) => {
      await Promise.all(rows.map((row) => upsertRow(tx, row)));
      console.log(
        `   Upserted ${rows.length} rows into banatic_2025_competence.`
      );
    });
    console.log('✅ Import completed.');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
