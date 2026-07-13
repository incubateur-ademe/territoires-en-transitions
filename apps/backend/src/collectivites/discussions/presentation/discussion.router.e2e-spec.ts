import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';

// Régression IDOR TET-7357 : un admin d'une collectivité A ne doit pas pouvoir
// muter discussions/messages appartenant à une collectivité B.
describe("DiscussionRouter — contrôle d'accès horizontal (IDOR TET-7357)", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectiviteVictime: Collectivite;
  let collectiviteAttaquant: Collectivite;
  let victimeUser: AuthenticatedUser;
  let attaquantUser: AuthenticatedUser;

  let victimeDiscussionId: number;
  let victimeMessageId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const victimeResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteVictime = victimeResult.collectivite;
    victimeUser = getAuthUserFromUserCredentials(victimeResult.user);

    const attaquantResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteAttaquant = attaquantResult.collectivite;
    attaquantUser = getAuthUserFromUserCredentials(attaquantResult.user);

    const victimeCaller = router.createCaller({ user: victimeUser });
    const discussion = await victimeCaller.collectivites.discussions.create({
      collectiviteId: collectiviteVictime.id,
      actionId: 'cae_1.1.1',
      message: 'Message de la victime',
    });
    victimeDiscussionId = discussion.id;
    victimeMessageId = discussion.messageId;

    return async () => {
      await app.close();
    };
  });

  const expectNotFound = (fn: () => Promise<unknown>) =>
    expect(fn()).rejects.toMatchObject({ code: 'NOT_FOUND' });

  test("update — ne peut pas changer le statut d'une discussion étrangère", async () => {
    const caller = router.createCaller({ user: attaquantUser });
    await expectNotFound(() =>
      caller.collectivites.discussions.update({
        collectiviteId: collectiviteAttaquant.id,
        discussionId: victimeDiscussionId,
        status: 'ferme',
      })
    );
  });

  test('updateMessage — ne peut pas modifier un message étranger', async () => {
    const caller = router.createCaller({ user: attaquantUser });
    await expectNotFound(() =>
      caller.collectivites.discussions.updateMessage({
        collectiviteId: collectiviteAttaquant.id,
        messageId: victimeMessageId,
        message: 'Message piraté',
      })
    );
  });

  test('delete — ne peut pas supprimer une discussion étrangère', async () => {
    const caller = router.createCaller({ user: attaquantUser });
    await expectNotFound(() =>
      caller.collectivites.discussions.delete({
        collectiviteId: collectiviteAttaquant.id,
        discussionId: victimeDiscussionId,
      })
    );
  });

  test('deleteMessage — ne peut pas supprimer un message étranger', async () => {
    const caller = router.createCaller({ user: attaquantUser });
    await expectNotFound(() =>
      caller.collectivites.discussions.deleteMessage({
        collectiviteId: collectiviteAttaquant.id,
        messageId: victimeMessageId,
        discussionId: victimeDiscussionId,
      })
    );
  });

  test('create (avec discussionId) — ne peut pas poster dans une discussion étrangère', async () => {
    const caller = router.createCaller({ user: attaquantUser });
    await expectNotFound(() =>
      caller.collectivites.discussions.create({
        collectiviteId: collectiviteAttaquant.id,
        discussionId: victimeDiscussionId,
        actionId: 'cae_1.1.1',
        message: 'Message posté illégalement',
      })
    );
  });
});
