#!/usr/bin/env tsx
/**
 * Import de la typologie SINOE (ADEME) des communes et EPCI.
 *
 * - Peuple le référentiel `typologie_sinoe` (upsert).
 * - Renseigne `collectivite.sinoe_id` :
 *   - communes : appariées par `commune_code` (colonne `code_commune` du CSV) ;
 *   - EPCI : appariés par `siren` (colonne `SIRET` du CSV, tronquée à 9 chiffres
 *     quand elle contient un SIRET).
 *
 * Le type de chaque fichier (communes ou EPCI) est détecté d'après ses colonnes.
 * Les CSV source (ex. TYPOLOGIE_COMMUNES_2024.csv, TYPOLOGIE_EPCI_2024.csv) sont
 * archivés dans le drive TeT, pas dans le dépôt.
 *
 * Idempotent : peut être relancé sans effet de bord.
 *
 * Usage :
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *     tsx apps/tools/src/migrations/sinoe/import-typologie-sinoe.ts <fichier.csv> [fichier.csv...]
 */

import { typologieSinoeTable } from '@tet/backend/collectivites/shared/models/typologie-sinoe.table';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as fs from 'fs';
import { parseCsvRecords, parseCsvRows, readCsvFile } from '../shared/csv';
import { getDatabase } from '../shared/db';
import {
  chunk,
  detectTypeFichier,
  parseCommunesRecords,
  parseEpciRecords,
  TYPOLOGIES_SINOE,
  type ParseResult,
  type TypeFichier,
  type TypologieParCle,
} from './utils';

const USAGE =
  'tsx apps/tools/src/migrations/sinoe/import-typologie-sinoe.ts <fichier.csv> [fichier.csv...]';

const BATCH_SIZE = 1000;
const MAX_NON_TROUVES_AFFICHES = 50;

type Tx = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

/** Paramètres d'import propres à chaque type de fichier */
const IMPORT_PAR_TYPE = {
  communes: {
    label: 'Communes',
    parse: parseCommunesRecords,
    colonneCle: 'commune_code',
    collectiviteType: collectiviteTypeEnum.COMMUNE,
  },
  epci: {
    label: 'EPCI',
    parse: parseEpciRecords,
    colonneCle: 'siren',
    collectiviteType: collectiviteTypeEnum.EPCI,
  },
} as const satisfies Record<TypeFichier, unknown>;

type FichierLu = {
  csvPath: string;
  type: TypeFichier;
  parsed: ParseResult;
};

const getCsvPaths = (): string[] => {
  const csvPaths = process.argv.slice(2);
  if (csvPaths.length === 0) {
    throw new Error(`Au moins un fichier CSV est requis.\nUsage : ${USAGE}`);
  }
  const introuvables = csvPaths.filter((csvPath) => !fs.existsSync(csvPath));
  if (introuvables.length > 0) {
    throw new Error(
      `Fichier(s) CSV introuvable(s) : ${introuvables.join(
        ', '
      )}\nUsage : ${USAGE}`
    );
  }
  return csvPaths;
};

const CSV_OPTIONS = { delimiter: ';', bom: true } as const;

const readFichier = (csvPath: string): FichierLu => {
  const content = readCsvFile(csvPath);
  const [colonnes = []] = parseCsvRows(
    content.split(/\r?\n/, 1)[0] ?? '',
    CSV_OPTIONS
  );
  const type = detectTypeFichier(colonnes);
  const parsed = IMPORT_PAR_TYPE[type].parse(
    parseCsvRecords(content, CSV_OPTIONS)
  );
  return { csvPath, type, parsed };
};

const upsertTypologies = async (tx: Tx): Promise<void> => {
  await tx
    .insert(typologieSinoeTable)
    .values(
      TYPOLOGIES_SINOE.filter((t) => t.id !== 'non_precise').map((t) => ({
        ...t,
      }))
    )
    .onConflictDoUpdate({
      target: [typologieSinoeTable.id],
      set: {
        codeSinoe: sql.raw(`excluded.${typologieSinoeTable.codeSinoe.name}`),
        libelle: sql.raw(`excluded.${typologieSinoeTable.libelle.name}`),
      },
    });
};

/**
 * Déduplique les lignes par `cle`, en gardant la dernière occurrence rencontrée
 * dans l'ordre du fichier. Logue un avertissement quand une clé apparaît
 * plusieurs fois avec des `sinoeId` différents.
 */
const dedupliquerParCle = (rows: TypologieParCle[]): TypologieParCle[] => {
  const parCle = new Map<string, TypologieParCle>();
  for (const row of rows) {
    const existante = parCle.get(row.cle);
    if (existante && existante.sinoeId !== row.sinoeId) {
      console.warn(
        `⚠️  Clé "${row.cle}" en doublon avec des typologies différentes ("${existante.sinoeId}" puis "${row.sinoeId}") : la dernière valeur est conservée.`
      );
    }
    parCle.set(row.cle, row);
  }
  return [...parCle.values()];
};

/**
 * Met à jour sinoe_id des collectivités du type donné, appariées sur la colonne
 * `colonneCle`. Renvoie les clés du CSV qui n'ont trouvé aucune collectivité.
 */
const updateSinoeIds = async (
  tx: Tx,
  rows: TypologieParCle[],
  colonneCle: string,
  type: string
): Promise<{ nbMisesAJour: number; nonTrouves: string[] }> => {
  const clesTrouvees = new Set<string>();
  let nbMisesAJour = 0;
  const rowsDedupliquees = dedupliquerParCle(rows);

  for (const paquet of chunk(rowsDedupliquees, BATCH_SIZE)) {
    const values = sql.join(
      paquet.map(({ cle, sinoeId }) => sql`(${cle}, ${sinoeId})`),
      sql`, `
    );
    const result = await tx.execute<{ cle: string }>(sql`
      update collectivite c
      set sinoe_id = v.sinoe_id
      from (values ${values}) as v (cle, sinoe_id)
      where c.${sql.identifier(colonneCle)} = v.cle
        and c.type = ${type}
      returning v.cle
    `);
    nbMisesAJour += result.rowCount ?? 0;
    result.rows.forEach(({ cle }) => clesTrouvees.add(cle));
  }

  const nonTrouves = rowsDedupliquees
    .map(({ cle }) => cle)
    .filter((cle) => !clesTrouvees.has(cle));
  return { nbMisesAJour, nonTrouves };
};

const logResult = (
  label: string,
  parsed: ParseResult,
  { nbMisesAJour, nonTrouves }: { nbMisesAJour: number; nonTrouves: string[] }
) => {
  console.log(`   ${label} : ${nbMisesAJour} collectivité(s) mise(s) à jour.`);
  if (parsed.invalides.length > 0) {
    console.warn(
      `⚠️  ${label} : ${parsed.invalides.length} ligne(s) invalide(s) ignorée(s) :`
    );
    parsed.invalides.forEach(({ ligne, raison }) =>
      console.warn(`  - ligne ${ligne} : ${raison}`)
    );
  }
  if (nonTrouves.length > 0) {
    console.warn(
      `⚠️  ${label} : ${nonTrouves.length} identifiant(s) non trouvé(s) en base.`
    );
    if (nonTrouves.length <= MAX_NON_TROUVES_AFFICHES) {
      nonTrouves.forEach((cle) => console.warn(`  - ${cle}`));
    }
  }
};

async function main() {
  // lit et valide tous les fichiers avant d'ouvrir la connexion
  const fichiers = getCsvPaths().map((csvPath) => {
    const fichier = readFichier(csvPath);
    console.log(
      `📂 ${csvPath} : fichier ${IMPORT_PAR_TYPE[fichier.type].label}, ${
        fichier.parsed.rows.length
      } ligne(s) exploitable(s).`
    );
    return fichier;
  });

  const { db, pool } = getDatabase('import-typologie-sinoe');
  try {
    await db.transaction(async (tx) => {
      await upsertTypologies(tx);
      console.log(
        `   ${
          TYPOLOGIES_SINOE.length - 1
        } typologie(s) upsertée(s) dans typologie_sinoe.`
      );

      for (const { csvPath, type, parsed } of fichiers) {
        const { label, colonneCle, collectiviteType } = IMPORT_PAR_TYPE[type];
        logResult(
          `${label} (${csvPath})`,
          parsed,
          await updateSinoeIds(tx, parsed.rows, colonneCle, collectiviteType)
        );
      }
    });
    console.log('✅ Import terminé.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Import échoué :', err);
  process.exit(1);
});
