import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { doublePrecision, integer, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { labellisationSchema } from './labellisation.schema';

export enum LabellisationEtoileEnumType {
  PREMIERE_ETOILE = '1',
  DEUXIEME_ETOILE = '2',
  TROISIEME_ETOILE = '3',
  QUATRIEME_ETOILE = '4',
  CINQUIEME_ETOILE = '5',
}

export const labellisationEtoileEnum = labellisationSchema.enum('etoile', [
  LabellisationEtoileEnumType.PREMIERE_ETOILE,
  LabellisationEtoileEnumType.DEUXIEME_ETOILE,
  LabellisationEtoileEnumType.TROISIEME_ETOILE,
  LabellisationEtoileEnumType.QUATRIEME_ETOILE,
  LabellisationEtoileEnumType.CINQUIEME_ETOILE,
]);

export const labellisationEtoileMetaTable = labellisationSchema.table(
  'etoile_meta',
  {
    etoile: labellisationEtoileEnum('etoile').primaryKey().notNull(),
    prochaineEtoile: labellisationEtoileEnum('prochaine_etoile'),
    longLabel: varchar('long_label', { length: 30 }).notNull(),
    shortLabel: varchar('short_label', { length: 15 }).notNull(),
    minRealisePercentage: integer('min_realise_percentage').notNull(),
    minRealiseScore: doublePrecision('min_realise_score').generatedAlwaysAs(
      sql`((min_realise_percentage)::numeric * 0.01)`
    ),
  }
);

export type LabellisationEtoileMetaType = InferSelectModel<
  typeof labellisationEtoileMetaTable
>;

export type CreateLabellisationEtoileMetaType = InferInsertModel<
  typeof labellisationEtoileMetaTable
>;

export const labellisationEtoileMetaSchema = createSelectSchema(
  labellisationEtoileMetaTable
);
export const createLabellisationEtoileMetaSchema = createInsertSchema(
  labellisationEtoileMetaTable
);
