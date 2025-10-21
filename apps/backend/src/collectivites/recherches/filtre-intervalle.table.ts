import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const TypeIntervalleEnum = {
  Population: 'population',
  Score: 'score',
  Remplissage: 'remplissage',
} as const;

const typeIntervallePgEnum = pgEnum('type', TypeIntervalleEnum);

export const filtreIntervalleTable = pgTable(
  'filtre_intervalle',
  {
    type: typeIntervallePgEnum('type').notNull(),
    id: varchar('id', { length: 30 }).notNull(),
    libelle: text('libelle').notNull(),
    intervalle: text('intervalle').notNull(), // numrange not supported by drizzle
  },
  (table) => [
    primaryKey({
      columns: [table.type, table.id],
    }),
  ]
);
