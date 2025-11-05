import { Etoile } from '@/domain/referentiels';
import { sql } from 'drizzle-orm';
import {
  customType,
  doublePrecision,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';
import { labellisationSchema } from './labellisation.schema';

export const etoileToInteger = customType<{
  data: Etoile;
  driverData: string;
}>({
  dataType() {
    return 'labellisation.etoile';
  },
  fromDriver(value: string): Etoile {
    return parseInt(value) as Etoile;
  },
  toDriver(value: Etoile) {
    return value.toString();
  },
});

export const etoileDefinitionTable = labellisationSchema.table('etoile_meta', {
  etoile: etoileToInteger('etoile').primaryKey().notNull(),
  prochaineEtoile: etoileToInteger('prochaine_etoile'),
  longLabel: varchar('long_label', { length: 30 }).notNull(),
  shortLabel: varchar('short_label', { length: 15 }).notNull(),
  minRealisePercentage: integer('min_realise_percentage').notNull(),
  minRealiseScore: doublePrecision('min_realise_score')
    .generatedAlwaysAs(sql`((min_realise_percentage)::numeric * 0.01)`)
    .notNull(),
});
