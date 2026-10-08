import { varchar } from 'drizzle-orm/pg-core';
import { importsSchema } from './imports-region.table';

/**
 * Correspondance n° SIREN → code INSEE des communes (BANATIC), chargée par
 * `data_layer/seed/imports/08-code_siren_commune.sql`.
 */
export const importCodeSirenCommuneTable = importsSchema.table(
  'code_siren_commune',
  {
    siren: varchar('siren', { length: 9 }).primaryKey(),
    /**
     * Un import plus ancien a laissé une partie des codes sans leur zéro
     * initial (`1001` pour `01001`) : comparer après `lpad`.
     */
    insee: varchar('insee', { length: 5 }).notNull(),
    libelle: varchar('libelle', { length: 300 }).notNull(),
  }
);
