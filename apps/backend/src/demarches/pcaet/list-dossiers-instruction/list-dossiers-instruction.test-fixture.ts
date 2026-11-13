import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
  cleanupCollectiviteDemarches,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { SEUIL_POPULATION_PCAET } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
// Ce fichier importe vitest : il ne sert qu'aux tests backend. Les fixtures de
// `demarches-pcaet.test-fixture.ts` sont aussi chargées par Playwright, qui ne
// peut pas importer vitest.
import { onTestFinished } from 'vitest';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { pickFreeRegionCode } from '../demarches-pcaet.test-fixture';

/**
 * Une DREAL, un Supra **hors** de sa région, et deux EPCI membres : l'un dans
 * la région de la DREAL, l'autre chez le Supra. Le dépôt du Supra couvre les
 * deux.
 */
export async function addTestDepotSupraVoisin({
  db,
  router,
}: {
  db: DatabaseService;
  router: TrpcRouter;
}) {
  const regionDreal = await pickFreeRegionCode(db, 'dreal');
  const dreal = await addTestCollectiviteAndUser(db, {
    user: { role: CollectiviteRole.ADMIN },
    collectivite: {
      type: 'dreal',
      regionCode: regionDreal,
      nom: 'DREAL test Supra voisin',
    },
  });
  // La DREAL prend sa région : la suivante tirée est forcément une autre.
  const regionSupra = await pickFreeRegionCode(db, 'dreal');

  const supra = await addTestCollectiviteAndUser(db, {
    user: { role: CollectiviteRole.ADMIN },
    collectivite: {
      natureInsee: 'PETR',
      regionCode: regionSupra,
      nom: 'PETR test du voisinage',
    },
  });
  const epciChezLaDreal = await addTestCollectivite(db, {
    nom: 'CC test chez la DREAL',
    natureInsee: 'CC',
    regionCode: regionDreal,
    population: SEUIL_POPULATION_PCAET + 1,
  });
  const epciChezLeSupra = await addTestCollectivite(db, {
    nom: 'CC test chez le Supra',
    natureInsee: 'CC',
    regionCode: regionSupra,
    population: 1000,
  });
  onTestFinished(async () => {
    // `demarche.created_by` retient l'utilisateur : les démarches partent
    // avant lui.
    await cleanupCollectiviteDemarches(db, supra.collectivite.id);
    await supra.cleanup();
    await epciChezLaDreal.cleanup();
    await epciChezLeSupra.cleanup();
    await dreal.cleanup();
  });

  await db.db.insert(collectiviteRelationsTable).values([
    { id: epciChezLaDreal.collectivite.id, parentId: supra.collectivite.id },
    { id: epciChezLeSupra.collectivite.id, parentId: supra.collectivite.id },
  ]);
  const depot = await router
    .createCaller({ user: getAuthUserFromUserCredentials(supra.user) })
    .demarches.pcaet.create({
      collectiviteId: supra.collectivite.id,
      collectivitesCouvertesIds: [
        epciChezLaDreal.collectivite.id,
        epciChezLeSupra.collectivite.id,
      ],
    });

  return {
    dreal,
    drealCaller: router.createCaller({
      user: getAuthUserFromUserCredentials(dreal.user),
    }),
    supra: supra.collectivite,
    epciChezLaDreal: epciChezLaDreal.collectivite,
    epciChezLeSupra: epciChezLeSupra.collectivite,
    depot,
  };
}
