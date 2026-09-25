#!/usr/bin/env tsx
/**
 * Reprise T&C vers TeT, étape 1 : copie les tables de T&C dans le schéma de
 * travail `reprise_tec` de TeT, telles quelles, sans les mots de passe ni les
 * notifications. N'écrit dans aucune table du produit.
 *
 * Simulation par défaut (copie faite puis annulée) ; `--confirm` pour valider.
 *
 * Usage :
 *   TEC_DATABASE_URL="postgresql://..." SUPABASE_DATABASE_URL="postgresql://..." \
 *     pnpx tsx apps/tools/src/migrations/reprise-tec/extraire-source/index.ts [--confirm]
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { escapeIdentifier, PoolClient } from 'pg';
import { getDatabases } from '../db';

const SCHEMA_TEC = '4223_pcaet';

const TABLES_TEC = [
  'demarche',
  'demarche_autre_demarche',
  'demarche_autre_demarche_hors_ec',
  'demarche_collectivite',
  'demarche_consommation',
  'demarche_domaine_vulnerabilite',
  'demarche_emission_ges',
  'demarche_enr',
  'demarche_enr_prod_et_conso',
  'demarche_enr_reseaux',
  'demarche_fichier',
  'demarche_historique',
  'demarche_polluant_total',
  'demarche_polluants',
  'demarche_sequestration_estimation',
  'demarche_sequestration_potentiel',
  'demarche_sequestration_production',
  'demarche_sequestration_renforcement',
  'demarche_type_demarche',
  'demarche_utilisateur',
  'action',
  'action_cible',
  'action_collectivite',
  'action_contact',
  'action_fichier',
  'action_historique',
  'action_image',
  'action_secteur',
  'action_secteur_autre',
  'action_type_action',
  'action_type_porteur',
  'action_type_porteur_autre',
  'action_volet',
  'collectivite',
  'utilisateur',
  'organisation_regionale',
];

const NEVER_COPIED_COLUMNS: Record<string, string[]> = {
  utilisateur: ['pw'],
};

const BATCH_SIZE = 5000;

type Column = { name: string; type: string };

const getSourceName = (table: string) =>
  `${escapeIdentifier(SCHEMA_TEC)}.${escapeIdentifier(table)}`;

const getStagingName = (table: string) =>
  `reprise_tec.${escapeIdentifier(`staging_${table}`)}`;

const formatNumber = (n: number) => n.toLocaleString('fr-FR');

const listColumns = async (
  reader: PoolClient
): Promise<Map<string, Column[]>> => {
  const { rows } = await reader.query<{
    table: string;
    name: string;
    type: string;
  }>(
    `select c.relname as table, a.attname as name,
            format_type(a.atttypid, a.atttypmod) as type
       from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = $1 and c.relname = any($2)
        and a.attnum > 0 and not a.attisdropped
      order by c.relname, a.attnum`,
    [SCHEMA_TEC, TABLES_TEC]
  );
  const columns = new Map<string, Column[]>();
  for (const { table, name, type } of rows) {
    if (!(NEVER_COPIED_COLUMNS[table] ?? []).includes(name)) {
      columns.set(table, [...(columns.get(table) ?? []), { name, type }]);
    }
  }
  return columns;
};

const countRows = async (client: PoolClient, table: string) => {
  const { rows } = await client.query<{ n: string }>(
    `select count(*) as n from ${table}`
  );
  return Number(rows[0].n);
};

const copyTable = async (
  reader: PoolClient,
  writer: PoolClient,
  table: string,
  columns: Column[]
): Promise<void> => {
  await writer.query(`drop table if exists ${getStagingName(table)}`);
  await writer.query(
    `create table ${getStagingName(table)} (${columns
      .map((c) => `${escapeIdentifier(c.name)} ${c.type}`)
      .join(', ')})`
  );

  // Chaque ligne voyage en JSON texte, de T&C à TeT, sans passer par des
  // objets JavaScript : ni date ni nombre n'est réinterprété en route.
  const cursor = escapeIdentifier(`copie_${table}`);
  await reader.query(
    `declare ${cursor} no scroll cursor for
       select to_json(t)::text as ligne
         from (select ${columns.map((c) => escapeIdentifier(c.name)).join(', ')}
                 from ${getSourceName(table)}) t`
  );
  for (;;) {
    const { rows } = await reader.query<{ ligne: string }>(
      `fetch ${BATCH_SIZE} from ${cursor}`
    );
    if (rows.length === 0) {
      break;
    }
    await writer.query(
      `insert into ${getStagingName(table)}
       select * from json_populate_recordset(null::${getStagingName(
         table
       )}, $1::json)`,
      [`[${rows.map((r) => r.ligne).join(',')}]`]
    );
  }
  await reader.query(`close ${cursor}`);
};

async function main() {
  const isConfirmed = process.argv.includes('--confirm');
  const { source, cible } = getDatabases('reprise-tec-extraire-source');
  const reader = await source.connect();

  try {
    // Les curseurs de copyTable n'existent que dans une transaction ; read only
    // interdit toute écriture dans la source.
    await reader.query('begin read only');

    const columns = await listColumns(reader);
    const missing = TABLES_TEC.filter((table) => !columns.has(table));
    if (missing.length > 0) {
      throw new Error(
        `Tables absentes de ${SCHEMA_TEC} : ${missing.join(
          ', '
        )}. Rien n'a été copié.`
      );
    }

    const writer = await cible.connect();
    try {
      await writer.query('begin');
      await writer.query(
        readFileSync(join(__dirname, '../espace-de-travail.sql'), 'utf8')
      );

      let total = 0;
      const mismatches: string[] = [];
      for (const table of TABLES_TEC) {
        const readCount = await countRows(reader, getSourceName(table));
        await copyTable(reader, writer, table, columns.get(table) ?? []);
        const copiedCount = await countRows(writer, getStagingName(table));
        total += copiedCount;
        console.log(
          `${table.padEnd(38)} ${formatNumber(readCount)} lues, ${formatNumber(
            copiedCount
          )} copiées`
        );
        if (copiedCount !== readCount) {
          mismatches.push(table);
        }
      }

      if (mismatches.length > 0) {
        throw new Error(
          `Lues et copiées diffèrent pour : ${mismatches.join(
            ', '
          )}. Rien n'a été copié.`
        );
      }

      if (isConfirmed) {
        await writer.query('commit');
        console.log(
          `\nCopie terminée : ${TABLES_TEC.length} tables, ${formatNumber(
            total
          )} lignes dans reprise_tec.`
        );
      } else {
        await writer.query('rollback');
        console.log(
          `\nSimulation : ${TABLES_TEC.length} tables, ${formatNumber(
            total
          )} lignes copiées puis annulées. Rien n'est resté dans la base. ` +
            'Relancer avec --confirm pour copier.'
        );
      }
    } catch (e) {
      await writer.query('rollback');
      throw e;
    } finally {
      writer.release();
    }
  } finally {
    await reader.query('rollback');
    reader.release();
    await source.end();
    await cible.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
