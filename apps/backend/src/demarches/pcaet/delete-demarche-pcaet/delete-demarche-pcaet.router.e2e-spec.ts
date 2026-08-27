import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

describe('Supprimer une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    return {
      collectivite: fixture.collectivite,
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      }),
    };
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Supprimer une démarche jamais transmise (avec pilotes)', async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const created = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
      pilotes: [{ userId: user.id, tagId: null }],
    });

    await caller.demarches.pcaet.delete({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    const demarches = await caller.demarches.pcaet.list({
      collectiviteId: fixture.collectivite.id,
    });
    expect(demarches).toEqual([]);
  });

  test('Refuser la suppression d’une démarche transmise pour avis', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    await expect(
      caller.demarches.pcaet.delete({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow(
      'Une démarche transmise ou publiée ne peut pas être supprimée'
    );
  });

  test("IDOR : une démarche n'est pas supprimable via une autre collectivité", async () => {
    const owner = await freshEditor();
    const created = await owner.caller.demarches.pcaet.create({
      collectiviteId: owner.collectivite.id,
    });

    const other = await freshEditor();
    await expect(
      other.caller.demarches.pcaet.delete({
        collectiviteId: other.collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");
  });
});
