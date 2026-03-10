#!/usr/bin/env tsx
/**
 * Import Banatic 2025 competence transfers from a competence-specific CSV.
 *
 * CSV headers:
 *   Code Insee Commune, Nom Commune, Département Commune,
 *   Siren Groupement, Nom Groupement, Nature Juridique Groupement,
 *   Siren Groupement intermédiaire, Nom Groupement intermédiaire, Nature Juridique Groupement intermédiaire
 *
 * Only rows where "Siren Groupement intermédiaire" and "Nom Groupement intermédiaire" are not empty are processed.
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-transferts/index.ts <competence_code> [path/to/competence.csv]
 */

import { collectiviteBanatic2025TransfertTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-transfert.table';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { findCollectiviteIdBySiren } from '../collectivite-db';
import { getCsvPathFromArgv, parseCsvRows, readCsvFile } from '../csv';
import { getDatabase } from '../db';
import {
  formatNatureTransfert,
  groupByEpci,
  parseAllRows,
  type TransfertInfo,
} from './utils';

const parseCompetenceCode = (arg: string): number => {
  const code = parseInt(arg, 10);
  if (isNaN(code) || code < 1000 || code > 9999) {
    throw new Error(
      `Invalid competence code: ${arg}. Must be a 4-digit number (1000-9999).`
    );
  }
  return code;
};

const upsertTransfert = async (
  db: NodePgDatabase,
  collectiviteId: number,
  competenceCode: number,
  natureTransfert: string
): Promise<void> => {
  await db
    .insert(collectiviteBanatic2025TransfertTable)
    .values({
      collectiviteId,
      competenceCode,
      natureTransfert,
    })
    .onConflictDoUpdate({
      target: [
        collectiviteBanatic2025TransfertTable.collectiviteId,
        collectiviteBanatic2025TransfertTable.competenceCode,
      ],
      set: { natureTransfert },
    });
};

const processTransferts = async (
  db: NodePgDatabase,
  competenceCode: number,
  transfertsByEpci: Map<string, TransfertInfo>
): Promise<{ inserted: number; notFound: string[] }> => {
  const notFound: string[] = [];
  let inserted = 0;

  for (const [epciSiren, info] of transfertsByEpci) {
    const collectiviteId = await findCollectiviteIdBySiren(db, epciSiren);
    if (collectiviteId === null) {
      notFound.push(`${epciSiren} (${info.epciName})`);
      continue;
    }

    const natureTransfert = formatNatureTransfert(info);
    await upsertTransfert(db, collectiviteId, competenceCode, natureTransfert);
    inserted++;
  }

  return { inserted, notFound };
};

const USAGE =
  'tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-transferts/index.ts <competence_code> <path/to/competence.csv>';

async function main() {
  const competenceCodeArg = process.argv[2];
  if (!competenceCodeArg) {
    throw new Error(`Missing competence code.\nUsage: ${USAGE}`);
  }

  const competenceCode = parseCompetenceCode(competenceCodeArg);

  const csvPath = getCsvPathFromArgv(3, USAGE);
  const fileContent = readCsvFile(csvPath);
  const { db, pool } = getDatabase('import-banatic-2025-transferts');

  try {
    console.log(`Importing transferts for competence ${competenceCode}`);

    const rawRows = parseCsvRows(fileContent, { delimiter: ';' });
    console.log(`Parsed ${rawRows.length - 1} data rows from CSV.`);

    const parsedRows = parseAllRows(rawRows);
    console.log(`Found ${parsedRows.length} rows with transfer data.`);

    const transfertsByEpci = groupByEpci(parsedRows);
    console.log(`Found ${transfertsByEpci.size} EPCIs with transfers.`);

    const { inserted, notFound } = await processTransferts(
      db,
      competenceCode,
      transfertsByEpci
    );

    console.log(`Inserted ${inserted} transfert records.`);

    if (notFound.length > 0) {
      console.warn(`EPCIs not found in database (${notFound.length}):`);
      notFound.forEach((s) => console.warn(`  - ${s}`));
    }

    console.log('Done.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
