import { integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';
import { banatic2025CompetenceTable } from './banatic-2025-competence.table';
import { banaticCompetenceTable } from './banatic-competence.table';

export const mappingTypeEnum = ['one_to_one', 'split', 'no_equivalent'] as const;
export type MappingType = (typeof mappingTypeEnum)[number];

export const banatic20212025CrosswalkTable = pgTable(
  'banatic_2021_2025_crosswalk',
  {
    id: serial('id').primaryKey(),
    code2021: integer('code_2021')
      .notNull()
      .references(() => banaticCompetenceTable.code),
    code2025: integer('code_2025').references(
      () => banatic2025CompetenceTable.competenceCode
    ),
    mappingType: text('mapping_type', { enum: mappingTypeEnum }).notNull(),
  },
  (table) => [unique().on(table.code2021, table.code2025)]
);
