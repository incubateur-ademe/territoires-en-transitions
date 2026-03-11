#!/usr/bin/env tsx
/**
 * Import Banatic 2025 competences per collectivité from the groupements CSV.
 *
 * Prerequisites:
 * - banatic_2025_competence populated (run import-banatic-2025-codes first).
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-collectivite-competences/index.ts [path/to/groupements.csv]
 */

import { collectiviteBanatic2025CompetenceTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-competence.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { findCollectiviteIdBySiren } from '../collectivite-db';
import { getCsvPathFromArgv, parseCsvRecords, readCsvFile } from '../csv';
import { getDatabase } from '../db';

const COL_SIREN = 3; // D
const COL_NATURE_JURIDIQUE = 5; // F

const COL_FIRST = 0;
const COL_NOM = 4; // E
const COL_POPULATION = 39;

type ColumnIndexToBanaticCode = Map<number, number>;

const getHeaders = (records: Record<string, string>[]): string[] =>
  records[0] ? Object.keys(records[0]) : [];

const firstRowPerSiren = (
  records: Record<string, string>[],
  sirenCol: string
): Record<string, string>[] => {
  const seen = new Set<string>();
  return records.filter((r) => {
    const siren = (r[sirenCol] ?? '').trim();
    if (!siren || seen.has(siren)) return false;
    seen.add(siren);
    return true;
  });
};

const buildColumnIndexToBanaticCode = (
  headers: string[],
  competences: { competenceCode: number; intitule: string }[]
): ColumnIndexToBanaticCode => {
  const intituleToCode = new Map(
    competences.map((c) => [c.intitule.trim(), c.competenceCode])
  );
  const map = new Map<number, number>();
  headers.forEach((h, i) => {
    const code = intituleToCode.get(h.trim());
    if (code !== undefined) map.set(i, code);
  });
  return map;
};

const isOui = (v: string): boolean => (v ?? '').trim().toUpperCase() === 'OUI';

// Cette collectivite a eu son siren début 2026 donc un siren temporaire a parfois été utilisé dans les fichiers
const SAEP_Risle_et_plateaux = {
  tempSiren: 'TEMP37729',
  validSiren: '102194990',
};

const parsedRowSchema = z.object({
  siren: z.string().min(1),
  departementCode: z
    .string()
    .transform((s) => {
      const v = (s ?? '').trim().slice(0, 2);
      return v.length === 2 ? v : null;
    })
    .nullable(),
  nom: z.string(),
  natureInsee: z.string().nullable(),
  population: z
    .union([z.string(), z.number()])
    .transform((s) => (s === '' || s === undefined ? null : Number(s)))
    .nullable(),
  competences: z.record(z.string(), z.boolean()),
});

type ParsedRow = z.infer<typeof parsedRowSchema>;

const rowToCompetences = (
  row: Record<string, string>,
  headers: string[],
  columnIndexToCode: ColumnIndexToBanaticCode
): Record<string, boolean> =>
  Object.fromEntries(
    Array.from(columnIndexToCode, ([index, code]) => [
      String(code),
      headers[index] ? isOui(row[headers[index]] ?? '') : false,
    ])
  );

const rowToParsed = (
  row: Record<string, string>,
  headers: string[],
  columnIndexToCode: ColumnIndexToBanaticCode
): ParsedRow =>
  parsedRowSchema.parse({
    siren: (row[headers[COL_SIREN]] ?? '').trim(),
    departementCode: row[headers[COL_FIRST]] ?? '',
    nom: (row[headers[COL_NOM]] ?? '').trim(),
    natureInsee: (row[headers[COL_NATURE_JURIDIQUE]] ?? '').trim() || null,
    population: row[headers[COL_POPULATION]],
    competences: rowToCompetences(row, headers, columnIndexToCode),
  });

const createCollectivite = async (
  db: NodePgDatabase,
  parsed: ParsedRow
): Promise<number> => {
  try {
    const [row] = await db
      .insert(collectiviteTable)
      .values({
        nom: parsed.nom,
        type: collectiviteTypeEnum.EPCI,
        siren:
          parsed.siren === SAEP_Risle_et_plateaux.tempSiren
            ? SAEP_Risle_et_plateaux.validSiren
            : parsed.siren,
        ...(parsed.departementCode && {
          departementCode: parsed.departementCode,
        }),
        ...(parsed.population !== null && { population: parsed.population }),
        ...(parsed.natureInsee && {
          natureInsee:
            parsed.natureInsee as (typeof collectiviteTable.$inferInsert)['natureInsee'],
        }),
      })
      .returning({ id: collectiviteTable.id });

    if (!row) throw new Error(`Failed to create collectivite ${parsed.siren}`);
    return row.id;
  } catch (error) {
    throw new Error(`Failed to create collectivite ${parsed.siren}: ${error}`);
  }
};

const ensureCollectiviteId = async (
  db: NodePgDatabase,
  parsed: ParsedRow
): Promise<{ collectiviteId: number; created: boolean }> => {
  const existing = await findCollectiviteIdBySiren(db, parsed.siren);
  if (existing !== null) return { collectiviteId: existing, created: false };
  const id = await createCollectivite(db, parsed);
  return { collectiviteId: id, created: true };
};

const insertCompetencesForCollectivite = async (
  db: NodePgDatabase,
  collectiviteId: number,
  competences: Record<string, boolean>
): Promise<number> => {
  const pairs = Object.entries(competences).map(([code, exercice]) => ({
    collectiviteId,
    competenceCode: parseInt(code, 10),
    exercice,
  }));
  if (pairs.length === 0) return 0;
  await db
    .insert(collectiviteBanatic2025CompetenceTable)
    .values(pairs)
    .onConflictDoNothing({
      target: [
        collectiviteBanatic2025CompetenceTable.collectiviteId,
        collectiviteBanatic2025CompetenceTable.competenceCode,
      ],
    });
  return pairs.length;
};

const USAGE =
  'tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-collectivite-competences/index.ts [path/to/groupements.csv]';

async function main() {
  const csvPath = getCsvPathFromArgv(2, USAGE);
  const fileContent = readCsvFile(csvPath);
  const { db, pool } = getDatabase(
    'import-banatic-2025-collectivite-competences'
  );

  try {
    const competences = await db
      .select({
        competenceCode: banatic2025CompetenceTable.competenceCode,
        intitule: banatic2025CompetenceTable.intitule,
      })
      .from(banatic2025CompetenceTable);

    const allRecords = parseCsvRecords(fileContent, {
      delimiter: ';',
      bom: true,
    });
    const headers = getHeaders(allRecords);
    const columnIndexToCode = buildColumnIndexToBanaticCode(
      headers,
      competences
    );
    const records = firstRowPerSiren(allRecords, headers[COL_SIREN]);

    console.log(
      `${allRecords.length} rows, ${records.length} unique SIREN, ${columnIndexToCode.size} competence columns.`
    );

    let upserted = 0;
    let created = 0;
    let skipped = 0;

    for (const row of records) {
      const parsed = rowToParsed(row, headers, columnIndexToCode);
      if (!parsed.siren) {
        skipped++;
        continue;
      }
      const { collectiviteId, created: c } = await ensureCollectiviteId(
        db,
        parsed
      );
      const n = await insertCompetencesForCollectivite(
        db,
        collectiviteId,
        parsed.competences
      );
      upserted += n;
      if (c) created++;
    }

    console.log(
      `   Upserted ${upserted} (collectivite_id, competence_code); ${created} new collectivite(s); ${skipped} skipped.`
    );
    console.log('✅ Done.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
