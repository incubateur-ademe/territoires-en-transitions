import { INestApplication } from '@nestjs/common';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleBackoffice,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PlatformRole } from '@tet/domain/users';
import { eq, inArray, sql } from 'drizzle-orm';
import { recetteCollectiviteTable } from './models/recette-collectivite.table';
import { recetteDossierTable } from './models/recette-dossier.table';
import { recetteEcartTable } from './models/recette-ecart.table';

export async function createTestRecetteTables({
  db,
}: DatabaseServiceInterface) {
  await db.execute(sql`
    create schema if not exists reprise_tec;
    create table if not exists reprise_tec.recette_collectivite (
      tec_collectivite_id   bigint primary key,
      tet_collectivite_id   integer,
      nom                   text not null,
      siren                 text,
      population            bigint,
      suivi_obligation      text,
      suivi_avis_etat_le    date,
      suivi_approbation_le  date
    );
    create table if not exists reprise_tec.recette_dossier (
      tec_dossier_id         bigint primary key,
      tec_collectivite_id    bigint,
      definitif_de           bigint,
      nom                    text,
      etat                   text,
      types                  integer[],
      publie                 boolean,
      oblige                 boolean,
      version                text,
      cree_le                date,
      lance_le               date,
      lance_brut             text,
      reception_projet_le    date,
      avis_dreal_le          date,
      avis_cr_le             date,
      depot_definitif_le     date,
      mis_a_jour_le          date,
      elu_referent           text,
      description            text,
      population_couverte    bigint,
      commentaire_statut     text,
      premier_plan_climat    boolean,
      verifie_ademe          boolean,
      motif                  text,
      melange                boolean not null,
      tet_demarche_id        integer,
      adoption_decidee_par   text
    );
    create table if not exists reprise_tec.recette_ecart (
      tec_dossier_id  bigint not null,
      table_source    text   not null,
      motif           text   not null,
      precision       text   not null,
      nombre          integer not null
    );
  `);
}

export async function addTestRecette(
  { db }: DatabaseServiceInterface,
  {
    collectivite,
    dossiers = [],
    ecarts = [],
  }: {
    collectivite: typeof recetteCollectiviteTable.$inferInsert;
    dossiers?: (typeof recetteDossierTable.$inferInsert)[];
    ecarts?: (typeof recetteEcartTable.$inferInsert)[];
  }
) {
  await db.insert(recetteCollectiviteTable).values(collectivite);
  if (dossiers.length) {
    await db.insert(recetteDossierTable).values(dossiers);
  }
  if (ecarts.length) {
    await db.insert(recetteEcartTable).values(ecarts);
  }
  const dossierIds = dossiers.map((d) => d.tecDossierId);
  return {
    cleanup: async () => {
      if (dossierIds.length) {
        await db
          .delete(recetteEcartTable)
          .where(inArray(recetteEcartTable.tecDossierId, dossierIds));
        await db
          .delete(recetteDossierTable)
          .where(inArray(recetteDossierTable.tecDossierId, dossierIds));
      }
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

export async function addTestSuperAdmin(
  app: INestApplication,
  router: TrpcRouter
) {
  const { user } = await addTestUser(app.get(DatabaseService));
  const authUser = getAuthUserFromUserCredentials(user);
  const caller = router.createCaller({ user: authUser });
  const { cleanup } = await addAndEnableUserSuperAdminMode({
    app,
    caller,
    userId: authUser.id,
  });
  return { authUser, caller, cleanup };
}

export async function addTestLecteurRepriseTec(
  app: INestApplication,
  router: TrpcRouter
) {
  const databaseService = app.get(DatabaseService);
  const { user } = await addTestUser(databaseService);
  const authUser = getAuthUserFromUserCredentials(user);
  const caller = router.createCaller({ user: authUser });
  const { cleanup } = await addUserRoleBackoffice({
    databaseService,
    userId: authUser.id,
    role: PlatformRole.BACKOFFICE_REPRISE_TEC_LECTURE,
  });
  return { authUser, caller, cleanup };
}
