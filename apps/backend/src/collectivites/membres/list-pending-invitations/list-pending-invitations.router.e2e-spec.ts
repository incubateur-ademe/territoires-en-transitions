import { INestApplication } from '@nestjs/common';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { invitationTable } from '../invitation.table';

type ListPendingInvitationsInput = inferProcedureInput<
  AppRouter['collectivites']['membres']['invitations']['listPendings']
>;

describe('CollectiviteMembresRouter listPendingInvitations', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectiviteId: number;
  let adminUser: AuthenticatedUser;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const result = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = result.collectivite.id;
    adminUser = getAuthUserFromUserCredentials(result.user);
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await databaseService.db
      .delete(invitationTable)
      .where(eq(invitationTable.collectiviteId, collectiviteId));
    await cleanup();
    await app.close();
  });

  test('peut lister les invitations en attente', async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListPendingInvitationsInput = {
      collectiviteId,
    };

    const result = await caller.collectivites.membres.invitations.listPendings(
      input
    );
    assert(result);
    expect(result).toHaveLength(0);

    await databaseService.db.insert(invitationTable).values({
      collectiviteId,
      email: 'test@test.com',
      role: CollectiviteRole.EDITION,
      createdBy: adminUser.id,
    });

    const result2 = await caller.collectivites.membres.invitations.listPendings(
      input
    );
    assert(result2);
    expect(result2).toHaveLength(1);
    expect(result2[0]).toMatchObject({
      email: 'test@test.com',
      role: CollectiviteRole.EDITION,
    });
  });

  test("ne peut pas lister les invitations si on n'est pas authentifié", async () => {
    const caller = router.createCaller({ user: null });

    const input: ListPendingInvitationsInput = {
      collectiviteId,
    };

    await expect(() =>
      caller.collectivites.membres.invitations.listPendings(input)
    ).rejects.toThrowError(/not authenticated/i);
  });
});
