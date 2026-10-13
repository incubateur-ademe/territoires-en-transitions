import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { eq, sql } from 'drizzle-orm';
import { recetteCollectiviteTable } from './models/recette-collectivite.table';

export async function createTestRecetteTables({
  db,
}: DatabaseServiceInterface) {
  await db.execute(sql`
    create schema if not exists reprise_tec;
    create table if not exists reprise_tec.recette_collectivite (
      tec_collectivite_id bigint primary key,
      tet_collectivite_id integer,
      nom                 text not null,
      siren               text,
      population          bigint
    );
  `);
}

export async function addTestRecetteCollectivite(
  { db }: DatabaseServiceInterface,
  collectivite: typeof recetteCollectiviteTable.$inferInsert
) {
  await db.insert(recetteCollectiviteTable).values(collectivite);
  return {
    cleanup: async () => {
      await db
        .delete(recetteCollectiviteTable)
        .where(
          eq(
            recetteCollectiviteTable.tecCollectiviteId,
            collectivite.tecCollectiviteId
          )
        );
    },
  };
}
