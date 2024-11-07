import { getTableColumns, sql, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * Crée un objet pour `onConflictUpdate.set` contenant pour
 * chaque colonne voulue une clause `excluded.<colonne>`
 * @param table Table pour laquelle on génère l'objet
 * @param columns Liste des colonnes de la table à mettre à jour en cas de conflit d'insertion
 * @returns Objet à passer à `onConflictUpdate.set`
 *
 * Ref: https://orm.drizzle.team/docs/guides/upsert
 */
export const buildConflictUpdateColumns = <
  T extends PgTable,
  Q extends keyof T['_']['columns']
>(
  table: T,
  columns: Q[]
) => {
  const cls = getTableColumns(table);
  return columns.reduce((acc, column) => {
    const colName = cls[column].name;
    acc[column] = sql.raw(`excluded.${colName}`);
    return acc;
  }, {} as Record<Q, SQL>);
};
