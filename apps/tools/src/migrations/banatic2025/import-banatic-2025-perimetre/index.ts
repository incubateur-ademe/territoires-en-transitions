#!/usr/bin/env tsx
/**
 * Import du périmètre Banatic 2025 des EPCI : nombre de communes membres.
 *
 * Source : fichier data.gouv « base nationale sur les intercommunalités »
 * (EPCI ↔ communes, une ligne par (EPCI, commune), séparateur `;`).
 * Téléchargement :
 *   https://www.data.gouv.fr/api/1/datasets/r/6e05c448-62cc-4470-aa0f-4f31adea0bc4
 *
 * Sert de dénominateur à l'inférence de délégation totale d'une compétence :
 * `nb_communes_transferees >= nb_communes_membres`.
 * Le comptage n'applique AUCUN filtre de population (cf. plan 2026-06-30-001, §1.3).
 *
 * Prérequis :
 * - Collectivités EPCI présentes en base
 *   (lancer import-banatic-2025-collectivite-competences d'abord).
 *
 * Usage :
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *     tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-perimetre/index.ts [path/to/perimetre-epci-communes.csv]
 */

import { collectiviteBanatic2025PerimetreTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-perimetre.table';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { findCollectiviteIdBySiren } from '../collectivite-db';
import { getCsvPathFromArgv, parseCsvRecords, readCsvFile } from '../csv';
import { getDatabase } from '../db';
import {
  collectDeclaredNbMembres,
  countCommunesByEpci,
  diffRecomptageVsDeclare,
  parsePerimetreRecords,
} from './utils';

const USAGE =
  'tsx apps/tools/src/migrations/banatic2025/import-banatic-2025-perimetre/index.ts [path/to/perimetre-epci-communes.csv]';

const upsertPerimetre = async (
  db: NodePgDatabase,
  collectiviteId: number,
  nbCommunesMembres: number
): Promise<void> => {
  await db
    .insert(collectiviteBanatic2025PerimetreTable)
    .values({ collectiviteId, nbCommunesMembres })
    .onConflictDoUpdate({
      target: [collectiviteBanatic2025PerimetreTable.collectiviteId],
      set: {
        nbCommunesMembres: sql.raw(
          `excluded.${collectiviteBanatic2025PerimetreTable.nbCommunesMembres.name}`
        ),
      },
    });
};

async function main() {
  const csvPath = getCsvPathFromArgv(2, USAGE);
  const fileContent = readCsvFile(csvPath);
  const { db, pool } = getDatabase('import-banatic-2025-perimetre');

  try {
    const records = parseCsvRecords(fileContent, { delimiter: ';', bom: true });
    const rows = parsePerimetreRecords(records);
    const countByEpci = countCommunesByEpci(rows);

    console.log(
      `${records.length} lignes, ${rows.length} lignes exploitables, ${countByEpci.size} EPCI avec périmètre.`
    );

    // Contrôle : la colonne nb_membres du CSV doit correspondre au recomptage.
    const ecarts = diffRecomptageVsDeclare(
      countByEpci,
      collectDeclaredNbMembres(records)
    );
    if (ecarts.length > 0) {
      console.warn(
        `⚠️  ${ecarts.length} écart(s) recomptage / nb_membres déclaré (le recomptage fait foi) :`
      );
      ecarts.forEach(({ epciSiren, recompte, declare }) =>
        console.warn(`  - ${epciSiren} : ${recompte} recomptées vs ${declare}`)
      );
    }

    let upserted = 0;
    const notFound: string[] = [];

    for (const [siren, nbCommunesMembres] of countByEpci) {
      const collectiviteId = await findCollectiviteIdBySiren(db, siren);
      if (collectiviteId === null) {
        notFound.push(siren);
        continue;
      }
      await upsertPerimetre(db, collectiviteId, nbCommunesMembres);
      upserted++;
    }

    console.log(`   Upserted ${upserted} périmètre(s) EPCI.`);

    if (notFound.length > 0) {
      console.warn(`⚠️  SIREN EPCI non trouvés en base (${notFound.length}) :`);
      notFound.forEach((s) => console.warn(`  - ${s}`));
    }

    console.log('✅ Done.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
