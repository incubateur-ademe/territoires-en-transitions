#!/usr/bin/env tsx
/**
 * Import Banatic 2021 -> 2025 crosswalk mapping.
 *
 * CSV format (semicolon-separated):
 *   Col 0: Libellé Catégorie
 *   Col 1: Anciens Codes Compétences (e.g. C1004)
 *   Col 2: Anciennes compétences
 *   Col 3: Arrow column ("--->" when mapping exists)
 *   Col 4: Nouveau Code Compétence (e.g. C1005)
 *   Col 5+: other metadata
 *
 * Row patterns:
 *   - Direct mapping:    ;C1004;old desc;--->;C1005;new desc
 *   - Split continuation: ;;--->;C1010;new desc        (inherits previous old code)
 *   - New-only code:      ;;;;C1035;new desc            (no predecessor, skipped)
 *   - Abandoned code:     ;C1010;old desc;;;;;          (no new equivalent)
 *
 * Mapping types:
 *   - one_to_one: old code maps to exactly one new code
 *   - split: old code maps to multiple new codes
 *   - no_equivalent: old code has no new equivalent
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-crosswalk/index.ts <csv_path>
 */

import {
  banatic20212025CrosswalkTable,
  type MappingType,
} from '@tet/backend/shared/models/banatic-2021-2025-crosswalk.table';
import { getCsvPathFromArgv, parseCsvRows, readCsvFile } from '../csv';
import { getDatabase } from '../db';
import { determineMappingTypes, parseCrosswalkRows } from './utils';

const USAGE =
  'tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-crosswalk/index.ts <csv_path>';

async function main() {
  const csvPath = getCsvPathFromArgv(2, USAGE);
  const fileContent = readCsvFile(csvPath);
  const { db, pool } = getDatabase('import-banatic-2025-crosswalk');

  console.log(`Parsing CSV: ${csvPath}`);
  const rawRows = parseCsvRows(fileContent, { delimiter: ';' });
  const rows = parseCrosswalkRows(rawRows);
  console.log(
    `Found ${rows.length} mapping rows from ${rawRows.length - 1} data rows.`
  );

  if (rows.length === 0) {
    console.log('Nothing to import.');
    await pool.end();
    return;
  }

  const mappingTypes = determineMappingTypes(rows);

  const stats: Record<MappingType, number> = {
    one_to_one: 0,
    split: 0,
    no_equivalent: 0,
  };
  for (const type of mappingTypes.values()) {
    stats[type]++;
  }
  console.log(
    `Mapping types: ${stats.one_to_one} one_to_one, ${stats.split} split, ${stats.no_equivalent} no_equivalent`
  );

  const dbRows = rows.map((row) => ({
    code2021: row.code2021,
    code2025: row.code2025,
    mappingType: mappingTypes.get(row.code2021) ?? ('one_to_one' as const),
  }));

  const tryInsert = (row: (typeof dbRows)[number]) =>
    db
      .insert(banatic20212025CrosswalkTable)
      .values(row)
      .onConflictDoNothing()
      .then(() => true as const)
      .catch(() => {
        console.warn(
          `⚠️  Skipped code_2021=${row.code2021} → code_2025=${row.code2025} (FK violation)`
        );
        return false as const;
      });

  try {
    const results = await dbRows.reduce(
      async (accP, row) => {
        const acc = await accP;
        return (await tryInsert(row)) ? { ...acc, inserted: acc.inserted + 1 } : { ...acc, skipped: acc.skipped + 1 };
      },
      Promise.resolve({ inserted: 0, skipped: 0 })
    );

    console.log(
      `Inserted ${results.inserted} rows into banatic_2021_2025_crosswalk (${results.skipped} skipped).`
    );
    console.log('Done.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
