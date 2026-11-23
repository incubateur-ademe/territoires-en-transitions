import { INestApplication } from '@nestjs/common';
import { createPersonneTag } from '@tet/backend/collectivites/tags/personnes/personne-tag.fixture';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { and, eq } from 'drizzle-orm';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
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

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const result = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = result.collectivite.id;
    adminUser = getAuthUserFromUserCredentials(result.user);
  });

  afterAll(async () => {
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

  test("l'identifiant de gestion ne permet pas d'accepter l'invitation", async () => {
    const { collectivite, user: adminCredentials } =
      await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
    const collectiviteId = collectivite.id;
    const { user } = await addTestUser(databaseService, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    const reader = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    const admin = router.createCaller({
      user: getAuthUserFromUserCredentials(adminCredentials),
    });
    const email = `admin-invite-${crypto.randomUUID()}@test.fr`;
    const tag = await createPersonneTag({
      database: databaseService,
      tagData: { collectiviteId, nom: email },
    });
    const id = await admin.collectivites.membres.invitations.create({
      collectiviteId,
      email,
      role: CollectiviteRole.ADMIN,
      tagIds: [tag.id],
    });

    const pending = await reader.collectivites.membres.invitations.listPendings(
      {
        collectiviteId,
      }
    );
    const invitation = pending.find((row) => row.email === email);
    expect(invitation).toEqual({ id, email, role: CollectiviteRole.ADMIN });
    assert(invitation);

    const personnes = await reader.collectivites.personnes.list({
      collectiviteIds: [collectiviteId],
    });
    expect(personnes.find((row) => row.tagId === tag.id)).toEqual({
      collectiviteId,
      nom: tag.nom,
      tagId: tag.id,
      userId: null,
      invitationId: id,
    });

    const personneTags = await reader.collectivites.tags.personnes.list({
      collectiviteId,
      tagIds: [tag.id],
    });
    expect(personneTags).toEqual([
      { tagId: tag.id, tagNom: tag.nom, email, invitationId: id },
    ]);

    const anonymous = router.createCaller({ user: null });
    await expect(
      anonymous.collectivites.membres.invitations.getEmail({
        invitationId: invitation.id,
      })
    ).resolves.toBeNull();
    await expect(
      reader.collectivites.membres.invitations.consume({
        invitationId: invitation.id,
      })
    ).rejects.toThrow(/n'existe pas/);

    const [access] = await databaseService.db
      .select({ role: utilisateurCollectiviteAccessTable.role })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.userId, user.id)
        )
      );
    expect(access.role).toBe(CollectiviteRole.LECTURE);
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
