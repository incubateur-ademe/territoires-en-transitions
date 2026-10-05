import { INestApplication, NotFoundException } from '@nestjs/common';
import { createPersonneTag } from '@tet/backend/collectivites/collectivites.test-fixture';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { describe, expect, onTestFinished } from 'vitest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';
import { indicateurPiloteTable } from '../../shared/models/indicateur-pilote.table';

describe('IndicateurDefinitionPiloteRouter', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let db: DatabaseService;
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = app.get(TrpcRouter);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testCollectiviteAndUserResult.collectivite;
    testUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );
  });

  afterAll(async () => {
    await app.close();
  });

  test('list existing pilotes associated with an indicateur', async () => {
    const caller = router.createCaller({ user: testUser });

    const piloteTag = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote tag' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ tagId: piloteTag.id }],
      },
    });

    const {
      data: [indicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur.pilotes).toHaveLength(1);
    expect(indicateur.pilotes).toContainEqual(
      expect.objectContaining({ tagId: piloteTag.id })
    );
  });

  test('list, update, delete pilotes associated with an indicateur and a collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const piloteTag1 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 1' },
    });
    const piloteTag2 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurBefore.pilotes).toHaveLength(0);

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ tagId: piloteTag1.id }, { tagId: piloteTag2.id }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.pilotes).toHaveLength(2);
    expect(indicateurAfter.pilotes).toContainEqual(
      expect.objectContaining({ tagId: piloteTag1.id })
    );
    expect(indicateurAfter.pilotes).toContainEqual(
      expect.objectContaining({ tagId: piloteTag2.id })
    );

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ tagId: piloteTag2.id }],
      },
    });

    const {
      data: [indicateurFinal],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurFinal.pilotes).toHaveLength(1);
    expect(indicateurFinal.pilotes).toContainEqual(
      expect.objectContaining({ tagId: piloteTag2.id })
    );
  });

  test('verify modified fields are updated', async () => {
    const caller = router.createCaller({ user: testUser });

    const piloteTag1 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 1' },
    });
    const piloteTag2 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
      },
    });

    const {
      data: [indicateurBefore],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ tagId: piloteTag1.id }, { tagId: piloteTag2.id }],
      },
    });

    const {
      data: [indicateurAfter],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateurAfter.modifiedBy?.id).toEqual(testUser.id);
    expect(new Date(indicateurAfter.modifiedAt).getTime()).toBeGreaterThan(
      new Date(indicateurBefore.modifiedAt).getTime()
    );
  });

  test('cannot upsert pilotes of another collectivite', async () => {
    const caller = router.createCaller({ user: testUser });

    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(db);
    onTestFinished(cleanup);

    const piloteTag1 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 1' },
    });
    const piloteTag2 = await createPersonneTag({
      database: db,
      tagData: { collectiviteId: collectivite.id, nom: 'Pilote 2' },
    });

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Test indicateur',
        pilotes: [{ tagId: piloteTag1.id }],
      },
    });

    const readRelations = () =>
      db.db
        .select()
        .from(indicateurPiloteTable)
        .where(eq(indicateurPiloteTable.indicateurId, indicateurId));
    const relationsBefore = await readRelations();
    expect(relationsBefore).toHaveLength(1);

    await expect(() =>
      caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: otherCollectivite.id,
        indicateurFields: {
          pilotes: [{ tagId: piloteTag1.id }, { tagId: piloteTag2.id }],
        },
      })
    ).rejects.toMatchObject({
      message: `Indicateur ${indicateurId} non trouvé pour la collectivité ${otherCollectivite.id}`,
      cause: expect.any(NotFoundException),
    });

    expect(await readRelations()).toEqual(relationsBefore);
  });

  test('retains and removes a departed pilote without allowing a new assignment', async () => {
    const {
      collectivite: currentCollectivite,
      users: [admin, pilote],
    } = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.EDITION },
      ],
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(admin),
    });
    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: currentCollectivite.id,
        pilotes: [{ userId: pilote.id }],
      },
    });
    const otherIndicateurId = await createIndicateurPerso({
      caller,
      indicateurData: { collectiviteId: currentCollectivite.id },
    });

    await db.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ isActive: false })
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, pilote.id),
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            currentCollectivite.id
          )
        )
      );

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: currentCollectivite.id,
      indicateurFields: {
        commentaire: 'Un commentaire modifié après le départ du pilote',
        pilotes: [{ userId: pilote.id }],
      },
    });
    const {
      data: [updatedIndicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: currentCollectivite.id,
      filters: { indicateurIds: [indicateurId] },
    });
    expect(updatedIndicateur.commentaire).toBe(
      'Un commentaire modifié après le départ du pilote'
    );
    expect(updatedIndicateur.pilotes).toEqual([
      expect.objectContaining({ userId: pilote.id }),
    ]);

    await expect(
      caller.indicateurs.indicateurs.update({
        indicateurId: otherIndicateurId,
        collectiviteId: currentCollectivite.id,
        indicateurFields: { pilotes: [{ userId: pilote.id }] },
      })
    ).rejects.toThrow(/pilotes doivent appartenir/i);

    await caller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId: currentCollectivite.id,
      indicateurFields: { pilotes: [] },
    });
    const {
      data: [indicateurWithoutPilote],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: currentCollectivite.id,
      filters: { indicateurIds: [indicateurId] },
    });
    expect(indicateurWithoutPilote.pilotes).toEqual([]);

    await expect(
      caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: currentCollectivite.id,
        indicateurFields: { pilotes: [{ userId: pilote.id }] },
      })
    ).rejects.toThrow(/pilotes doivent appartenir/i);
  });

  test('rejects assigning an active member from another collectivité', async () => {
    const { user: otherUser } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const caller = router.createCaller({ user: testUser });
    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: { collectiviteId: collectivite.id },
    });

    await expect(
      caller.indicateurs.indicateurs.update({
        indicateurId,
        collectiviteId: collectivite.id,
        indicateurFields: { pilotes: [{ userId: otherUser.id }] },
      })
    ).rejects.toThrow(/pilotes doivent appartenir/i);
  });
});
