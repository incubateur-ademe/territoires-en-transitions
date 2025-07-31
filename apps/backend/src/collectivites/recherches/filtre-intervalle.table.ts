import { getEnumValues } from '@/backend/utils/enum.utils';
import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const typeIntervalle = {
  Population: 'population',
  Score: 'score',
  Remplissage: 'remplissage',
} as const;

export const typeIntervalleEnum = getEnumValues(typeIntervalle);

const typeIntervallePgEnum = pgEnum('type', typeIntervalleEnum);

export const filtreIntervalleTable = pgTable(
  'filtre_intervalle',
  {
    type: typeIntervallePgEnum('type').notNull(),
    id: varchar('id', { length: 30 }).notNull(),
    libelle: text('libelle').notNull(),
    intervalle: text('intervalle').notNull(), // numrange not supported by drizzle
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.type, table.id],
      }),
    };
  }
);
