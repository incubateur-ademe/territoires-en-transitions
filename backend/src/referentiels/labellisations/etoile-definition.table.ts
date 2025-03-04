import { sql } from 'drizzle-orm';
import {
  customType,
  doublePrecision,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { labellisationSchema } from './labellisation.schema';

export const EtoileEnum = {
  PREMIERE_ETOILE: 1,
  DEUXIEME_ETOILE: 2,
  TROISIEME_ETOILE: 3,
  QUATRIEME_ETOILE: 4,
  CINQUIEME_ETOILE: 5,
} as const;

export type Etoile = (typeof EtoileEnum)[keyof typeof EtoileEnum];

export const etoilePgEnum = labellisationSchema.enum('etoile', [
  EtoileEnum.PREMIERE_ETOILE.toString(),
  EtoileEnum.DEUXIEME_ETOILE.toString(),
  EtoileEnum.TROISIEME_ETOILE.toString(),
  EtoileEnum.QUATRIEME_ETOILE.toString(),
  EtoileEnum.CINQUIEME_ETOILE.toString(),
]);

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

export type EtoileDefinition = typeof etoileDefinitionTable.$inferSelect;

export const etoileDefinitionSchema = createSelectSchema(etoileDefinitionTable);
