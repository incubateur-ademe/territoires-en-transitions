import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

describe('Récupérer et lister les démarches PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let otherCollectivite: Collectivite;
  let otherEditorUser: AuthenticatedUser;

  // Une seule démarche « en cours » par collectivité : chaque test qui crée
  // travaille sur sa propre collectivité fraîche.
  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const first = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectivite = first.collectivite;
    editorUser = getAuthUserFromUserCredentials(first.user);

    const second = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    otherCollectivite = second.collectivite;
    otherEditorUser = getAuthUserFromUserCredentials(second.user);

    return async () => {
      await app.close();
    };
  });

  test('Récupérer une démarche existante', async () => {
    const caller = router.createCaller({ user: editorUser });
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
      titre: 'Démarche à récupérer',
    });

    const demarche = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    expect(demarche.id).toBe(created.id);
    expect(demarche.titre).toBe('Démarche à récupérer');
  });

  test("IDOR : une démarche n'est pas lisible via une autre collectivité", async () => {
    const { caller, collectivite: ownerCollectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: ownerCollectivite.id,
    });

    // Un éditeur d'une autre collectivité ne peut pas lire la démarche en
    // passant sa propre collectivité : le WHERE couple id + collectiviteId.
    const otherCaller = router.createCaller({ user: otherEditorUser });
    await expect(
      otherCaller.demarches.pcaet.get({
        collectiviteId: otherCollectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");
  });

  test('Lister les démarches de la collectivité (plus récente en premier)', async () => {
    const { caller, collectivite: localCollectivite } = await freshEditor();

    const premiere = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
      titre: 'Première démarche',
    });
    // La première doit sortir du statut « en cours » pour autoriser la seconde.
    await db.db
      .update(demarcheTable)
      .set({ status: 'publie' })
      .where(eq(demarcheTable.id, premiere.id));
    const seconde = await caller.demarches.pcaet.create({
      collectiviteId: localCollectivite.id,
      titre: 'Seconde démarche',
    });

    const demarches = await caller.demarches.pcaet.list({
      collectiviteId: localCollectivite.id,
    });

    expect(demarches.map((demarche) => demarche.id)).toEqual(
      expect.arrayContaining([premiere.id, seconde.id])
    );
    expect(demarches).toHaveLength(2);
    expect(new Date(demarches[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(demarches[1].createdAt).getTime()
    );
  });
});
