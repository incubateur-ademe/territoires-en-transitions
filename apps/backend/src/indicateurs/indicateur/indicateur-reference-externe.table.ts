import { sql } from 'drizzle-orm';
import {
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

/** Références et contrats de lecture externes, publiés avec les définitions TeT. */
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
    libelleSource: text('libelle_source'),
    uniteImport: text('unite_import'),
    typeImport: text('type_import', { enum: ['action', 'cibles'] }),
    ciblesImport: text('cibles_import'),
    anneeCible: integer('annee_cible'),
    valeurMin: doublePrecision('valeur_min'),
    valeurMax: doublePrecision('valeur_max'),
    plafondCible: text('plafond_cible'),
    libellesCible: text('libelles_cible'),
    unitesAcceptees: text('unites_acceptees'),
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
    check(
      'indicateur_reference_externe_libelle_source_check',
      sql`${table.libelleSource} IS NULL OR (${table.libelleSource} <> '' AND ${table.libelleSource} = btrim(${table.libelleSource}))`
    ),
    check(
      'indicateur_reference_externe_unite_import_check',
      sql`${table.uniteImport} IS NULL OR (${table.uniteImport} <> '' AND ${table.uniteImport} = btrim(${table.uniteImport}))`
    ),
    check(
      'indicateur_reference_externe_type_import_check',
      sql`${table.typeImport} IN ('action', 'cibles')`
    ),
    check(
      'indicateur_reference_externe_annee_cible_check',
      sql`${table.anneeCible} BETWEEN 1000 AND 9999`
    ),
    check(
      'indicateur_reference_externe_bornes_import_check',
      sql`${table.valeurMin} <= ${table.valeurMax}`
    ),
    index('indicateur_reference_externe_indicateur_id_idx').on(
      table.indicateurId
    ),
  ]
);
