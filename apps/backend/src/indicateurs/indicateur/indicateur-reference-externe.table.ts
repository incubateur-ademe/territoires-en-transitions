import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

/** Identité d'un indicateur dans un catalogue externe, publiée avec sa définition. */
export const indicateurReferenceExterneTable = pgTable(
  'indicateur_reference_externe',
  {
    source: text('source').notNull(),
    codeExterne: text('code_externe').notNull(),
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      { onDelete: 'cascade' }
    ),
    lienSource: text('lien_source').notNull(),
    version: text('version').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.source, table.codeExterne] }),
    check(
      'indicateur_reference_externe_source_check',
      sql`${table.source} <> '' AND ${table.source} = btrim(${table.source})`
    ),
    check(
      'indicateur_reference_externe_code_externe_check',
      sql`${table.codeExterne} <> '' AND ${table.codeExterne} = btrim(${table.codeExterne})`
    ),
    check(
      'indicateur_reference_externe_lien_source_check',
      sql`${table.lienSource} <> '' AND ${table.lienSource} = btrim(${table.lienSource})`
    ),
    index('indicateur_reference_externe_indicateur_id_idx').on(
      table.indicateurId
    ),
  ]
);
