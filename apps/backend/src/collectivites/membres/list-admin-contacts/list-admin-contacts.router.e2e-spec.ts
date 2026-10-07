import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

describe('collectivites.membres.listAdminContacts', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('un utilisateur sans rôle sur la collectivité voit les administrateurs actifs, et eux seuls', async () => {
    const fixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.EDITION },
      ],
    });
    onTestFinished(fixture.cleanup);
    const [admin, adminInactif] = fixture.users;

    await databaseService.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ isActive: false })
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, adminInactif.id),
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            fixture.collectivite.id
          )
        )
      );

    const { user: visiteur, cleanup } = await addTestUser(databaseService);
    onTestFinished(cleanup);

    const contacts = await router
      .createCaller({ user: getAuthUserFromUserCredentials(visiteur) })
      .collectivites.membres.listAdminContacts({
        collectiviteId: fixture.collectivite.id,
      });

    expect(contacts).toEqual([
      { prenom: admin.prenom, nom: admin.nom, email: admin.email },
    ]);
  });

  test('refuse un utilisateur non connecté', async () => {
    await expect(
      router
        .createCaller({ user: null })
        .collectivites.membres.listAdminContacts({ collectiviteId: 1 })
    ).rejects.toThrow();
  });
});
