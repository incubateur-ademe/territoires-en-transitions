import { INestApplication } from '@nestjs/common';
import { MembreFonctionEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  addTestUser,
  deleteUserCollectiviteRole,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { membreTable } from '../membre.table';

type ListInput = inferProcedureInput<
  AppRouter['collectivites']['membres']['list']
>;

describe('CollectiviteMembresRouter mutate', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite1: { id: number };
  let collectivite2: { id: number };
  let collectivite3: { id: number };
  let adminUser: AuthenticatedUser;
  let editionUser: AuthenticatedUser;
  let lectureUser: AuthenticatedUser;
  let externalUser: AuthenticatedUser;
  const allCleanup: (() => Promise<void>)[] = [];

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const { collectivite: c1, cleanup: c1Cleanup } = await addTestCollectivite(
      db
    );
    const { collectivite: c2, cleanup: c2Cleanup } = await addTestCollectivite(
      db
    );
    const { collectivite: c3, cleanup: c3Cleanup } = await addTestCollectivite(
      db
    );
    collectivite1 = c1;
    collectivite2 = c2;
    collectivite3 = c3;

    // Admin sur collectivités 1 et 2
    const { user: admin, cleanup: adminCleanup } = await addTestUser(db, {
      collectiviteId: collectivite1.id,
      role: CollectiviteRole.ADMIN,
    });
    await setUserCollectiviteRole(db, {
      userId: admin.id,
      collectiviteId: collectivite2.id,
      role: CollectiviteRole.ADMIN,
    });
    adminUser = getAuthUserFromUserCredentials(admin);
    allCleanup.push(async () => {
      await deleteUserCollectiviteRole(db, {
        userId: admin.id,
        collectiviteId: collectivite2.id,
      });
      await adminCleanup();
    });

    // Edition sur collectivités 1 et 2
    const { user: edition, cleanup: editionCleanup } = await addTestUser(db, {
      collectiviteId: collectivite1.id,
      role: CollectiviteRole.EDITION,
    });
    await setUserCollectiviteRole(db, {
      userId: edition.id,
      collectiviteId: collectivite2.id,
      role: CollectiviteRole.EDITION,
    });
    await db.db.insert(membreTable).values({
      userId: edition.id,
      collectiviteId: collectivite1.id,
      fonction: 'politique',
      detailsFonction: 'Politique YILI de cette collectivité',
      champIntervention: ['eci', 'cae'],
    });
    editionUser = getAuthUserFromUserCredentials(edition);
    allCleanup.push(async () => {
      await db.db
        .delete(membreTable)
        .where(
          and(
            eq(membreTable.userId, edition.id),
            eq(membreTable.collectiviteId, collectivite1.id)
          )
        );
      await deleteUserCollectiviteRole(db, {
        userId: edition.id,
        collectiviteId: collectivite2.id,
      });
      await editionCleanup();
    });

    // Lecture sur collectivité 1
    const { user: lecture, cleanup: lectureCleanup } = await addTestUser(db, {
      collectiviteId: collectivite1.id,
      role: CollectiviteRole.LECTURE,
    });
    lectureUser = getAuthUserFromUserCredentials(lecture);
    allCleanup.push(lectureCleanup);

    // Admin uniquement sur collectivité 3 (sans accès à 1 et 2)
    const { user: external, cleanup: externalCleanup } = await addTestUser(db, {
      collectiviteId: collectivite3.id,
      role: CollectiviteRole.ADMIN,
    });
    externalUser = getAuthUserFromUserCredentials(external);
    allCleanup.push(externalCleanup);

    // Nettoyer les collectivités en dernier (après les users/droits)
    allCleanup.push(c1Cleanup, c2Cleanup, c3Cleanup);
  });

  afterAll(async () => {
    await app.close();
  });

  test('admin peut mettre à jour un autre membre (fonction, detailsFonction, champIntervention)', async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListInput = {
      collectiviteId: collectivite1.id,
    };

    // vérifie l'état avant de modifier
    const result = await caller.collectivites.membres.list(input);
    const editionMember = result.membres.find(
      (r) => r.userId === editionUser.id
    );
    assert(editionMember);
    expect(editionMember).toMatchObject({
      role: CollectiviteRole.EDITION,
      fonction: 'politique',
      detailsFonction: 'Politique YILI de cette collectivité',
      champIntervention: ['eci', 'cae'],
    });

    // met à jour la fonction et l'intitulé de poste
    await caller.collectivites.membres.update([
      {
        collectiviteId: collectivite1.id,
        userId: editionUser.id,
        fonction: MembreFonctionEnum.CONSEILLER,
        detailsFonction: 'Yili le conseiller',
      },
    ]);

    // vérifie le résultat
    const result3 = await caller.collectivites.membres.list(input);
    const editionMemberModified = result3.membres.find(
      (r) => r.userId === editionUser.id
    );
    expect(editionMemberModified).toMatchObject({
      role: CollectiviteRole.EDITION,
      fonction: 'conseiller',
      detailsFonction: 'Yili le conseiller',
      champIntervention: ['eci', 'cae'],
    });
  });

  test("admin peut mettre à jour le rôle (niveau_acces) d'un membre", async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListInput = {
      collectiviteId: collectivite1.id,
    };

    const result = await caller.collectivites.membres.list(input);
    const editionMember = result.membres.find(
      (r) => r.userId === editionUser.id
    );
    assert(editionMember);
    expect(editionMember.role).toBe(CollectiviteRole.EDITION);

    await caller.collectivites.membres.update([
      {
        collectiviteId: collectivite1.id,
        userId: editionUser.id,
        role: CollectiviteRole.LECTURE,
      },
    ]);

    const resultAfter = await caller.collectivites.membres.list(input);
    const editionMemberAfterRoleChange = resultAfter.membres.find(
      (r) => r.userId === editionUser.id
    );
    expect(editionMemberAfterRoleChange?.role).toBe(CollectiviteRole.LECTURE);
  });

  test('edition peut mettre à jour ses propres infos membre (soi)', async () => {
    const caller = router.createCaller({ user: editionUser });

    await caller.collectivites.membres.update([
      {
        collectiviteId: collectivite1.id,
        userId: editionUser.id,
        detailsFonction: 'Yili conseiller mise à jour',
        fonction: MembreFonctionEnum.CONSEILLER,
      },
    ]);

    const result = await caller.collectivites.membres.list({
      collectiviteId: collectivite1.id,
    });
    const editionMember = result.membres.find(
      (r) => r.userId === editionUser.id
    );
    expect(editionMember).toMatchObject({
      detailsFonction: 'Yili conseiller mise à jour',
      fonction: 'conseiller',
    });
  });

  test('edition ne peut pas modifier un autre membre (matrice: soi)', async () => {
    const caller = router.createCaller({ user: editionUser });

    await expect(
      caller.collectivites.membres.update([
        {
          collectiviteId: collectivite1.id,
          userId: adminUser.id,
          detailsFonction: 'tentative non autorisée',
        },
      ])
    ).rejects.toThrow();
  });

  test('edition ne peut pas modifier le rôle (admin only)', async () => {
    const caller = router.createCaller({ user: editionUser });

    await expect(
      caller.collectivites.membres.update([
        {
          collectiviteId: collectivite1.id,
          userId: editionUser.id,
          role: CollectiviteRole.ADMIN,
        },
      ])
    ).rejects.toThrow();
  });

  test('lecture peut mettre à jour ses propres infos membre (soi)', async () => {
    const caller = router.createCaller({ user: lectureUser });

    await caller.collectivites.membres.update([
      {
        collectiviteId: collectivite1.id,
        userId: lectureUser.id,
        detailsFonction: 'Lecteur qui met à jour sa fiche',
        fonction: MembreFonctionEnum.CONSEILLER,
      },
    ]);

    const result = await router
      .createCaller({ user: adminUser })
      .collectivites.membres.list({ collectiviteId: collectivite1.id });
    const lectureMember = result.membres.find(
      (r) => r.userId === lectureUser.id
    );

    expect(lectureMember).toMatchObject({
      detailsFonction: 'Lecteur qui met à jour sa fiche',
      fonction: 'conseiller',
    });
  });

  test('utilisateur sans accès à la collectivité ne peut pas modifier', async () => {
    const caller = router.createCaller({ user: externalUser });

    await expect(
      caller.collectivites.membres.update([
        {
          collectiviteId: collectivite1.id,
          userId: editionUser.id,
          detailsFonction: 'tentative sans accès',
        },
      ])
    ).rejects.toThrow();
  });

  describe('remove', () => {
    test('admin peut retirer un autre membre', async () => {
      const caller = router.createCaller({ user: adminUser });

      await caller.collectivites.membres.remove({
        collectiviteId: collectivite1.id,
        userId: editionUser.id,
      });

      const result = await router
        .createCaller({ user: adminUser })
        .collectivites.membres.list({ collectiviteId: collectivite1.id });
      const editionMember = result.membres.find(
        (r) => r.userId === editionUser.id
      );
      expect(editionMember).toBeUndefined();
    });

    test('edition ne peut pas retirer un autre membre', async () => {
      const caller = router.createCaller({ user: editionUser });

      await expect(
        caller.collectivites.membres.remove({
          collectiviteId: collectivite2.id,
          userId: adminUser.id,
        })
      ).rejects.toThrow();
    });

    test('edition peut se retirer lui-même', async () => {
      const caller = router.createCaller({ user: editionUser });

      await caller.collectivites.membres.remove({
        collectiviteId: collectivite2.id,
        userId: editionUser.id,
      });

      const result = await router
        .createCaller({ user: adminUser })
        .collectivites.membres.list({ collectiviteId: collectivite2.id });
      const editionMember = result.membres.find(
        (r) => r.userId === editionUser.id
      );
      expect(editionMember).toBeUndefined();
    });

    test('lecture peut se retirer lui-même', async () => {
      const caller = router.createCaller({ user: lectureUser });

      await caller.collectivites.membres.remove({
        collectiviteId: collectivite1.id,
        userId: lectureUser.id,
      });

      const result = await router
        .createCaller({ user: lectureUser })
        .collectivites.membres.list({ collectiviteId: collectivite1.id });

      const lectureMember = result.membres.find(
        (r) => r.userId === lectureUser.id
      );
      expect(lectureMember).toBeUndefined();
    });

    test('admin peut se retirer lui-même', async () => {
      const caller = router.createCaller({ user: adminUser });

      // Admin se retire de la collectivité 2 ; après cela il n'a plus accès pour vérifier
      await caller.collectivites.membres.remove({
        collectiviteId: collectivite2.id,
        userId: adminUser.id,
      });
      // L'opération a réussi si aucune exception n'a été levée
    });

    test('utilisateur sans accès à la collectivité ne peut pas retirer', async () => {
      const caller = router.createCaller({ user: externalUser });

      await expect(
        caller.collectivites.membres.remove({
          collectiviteId: collectivite1.id,
          userId: editionUser.id,
        })
      ).rejects.toThrow();
    });
  });
});
