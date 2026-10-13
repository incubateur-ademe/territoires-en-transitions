import { bigint, integer, text } from 'drizzle-orm/pg-core';
import { repriseTecSchema } from './reprise-tec.schema';

export const recetteEcartTable = repriseTecSchema.table('recette_ecart', {
  tecDossierId: bigint('tec_dossier_id', { mode: 'number' }).notNull(),
  tableSource: text('table_source').notNull(),
  motif: text('motif').notNull(),
  precision: text('precision').notNull(),
  nombre: integer('nombre').notNull(),
});
