import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { createDemarche } from '../demarches-pcaet.test-fixture';

describe('demarches.pcaet.listPublic', () => {
  let db: DatabaseService;
  let router: TrpcRouter;
  let visiteurCaller: ReturnType<TrpcRouter['createCaller']>;

  const setStatus = (demarcheId: number, status: DemarchePcaetStatus) =>
    db.db
      .update(demarcheTable)
      .set({ status })
      .where(eq(demarcheTable.id, demarcheId));

  beforeAll(async () => {
    const app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const visiteur = await addTestUser(db);
    visiteurCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(visiteur.user),
    });

    return async () => {
      await app.close();
    };
  });

  test('un visiteur ne voit que les démarches adoptées et archivées', async () => {
    const { collectiviteId, caller, demarche } = await createDemarche(
      db,
      router
    );
    await setStatus(demarche.id, DemarchePcaetStatusEnum.ARCHIVE);
    // L'index unique ne tolère qu'une démarche en cours : l'archivée libère la
    // place de la suivante, qu'on laisse en élaboration.
    const enElaboration = await caller.demarches.pcaet.create({
      collectiviteId,
    });

    const demarches = await visiteurCaller.demarches.pcaet.listPublic({
      collectiviteId,
    });

    expect(demarches.map(({ id }) => id)).toEqual([demarche.id]);
    expect(demarches[0]).toMatchObject({
      id: demarche.id,
      status: DemarchePcaetStatusEnum.ARCHIVE,
    });
    expect(demarches[0]).not.toHaveProperty('transitions');
    expect(demarches[0]).not.toHaveProperty('planActionIds');

    await setStatus(enElaboration.id, DemarchePcaetStatusEnum.PUBLIE);
    const apresAdoption = await visiteurCaller.demarches.pcaet.listPublic({
      collectiviteId,
    });
    expect(apresAdoption.map(({ id }) => id).sort()).toEqual(
      [demarche.id, enElaboration.id].sort()
    );
  });

  test('ne donne des pilotes que leur nom', async () => {
    const { collectiviteId, caller, demarche, user } = await createDemarche(
      db,
      router
    );
    await caller.demarches.pcaet.update({
      collectiviteId,
      demarcheId: demarche.id,
      pilotes: [{ userId: user.id }],
    });
    await setStatus(demarche.id, DemarchePcaetStatusEnum.PUBLIE);

    const [publique] = await visiteurCaller.demarches.pcaet.listPublic({
      collectiviteId,
    });

    expect(publique.pilotes).toHaveLength(1);
    expect(Object.keys(publique.pilotes[0])).toEqual(['nom']);
  });

  test('refuse un visiteur sur une collectivité en accès restreint, pas un membre en lecture', async () => {
    const { collectiviteId, demarche } = await createDemarche(db, router, {
      collectivite: { accesRestreint: true },
    });
    await setStatus(demarche.id, DemarchePcaetStatusEnum.PUBLIE);

    await expect(
      visiteurCaller.demarches.pcaet.listPublic({ collectiviteId })
    ).rejects.toThrow();

    const lecteur = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    const lecteurCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(lecteur.user),
    });
    const demarches = await lecteurCaller.demarches.pcaet.listPublic({
      collectiviteId,
    });
    expect(demarches.map(({ id }) => id)).toEqual([demarche.id]);
  });

  test("la liste d'édition reste fermée au visiteur", async () => {
    const { collectiviteId, demarche } = await createDemarche(db, router);
    await setStatus(demarche.id, DemarchePcaetStatusEnum.PUBLIE);

    await expect(
      visiteurCaller.demarches.pcaet.list({ collectiviteId })
    ).rejects.toThrow();
  });
});
