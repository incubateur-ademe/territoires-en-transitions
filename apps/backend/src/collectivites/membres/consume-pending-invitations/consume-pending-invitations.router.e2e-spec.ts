import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, collectiviteTypeEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { invitationTable } from '../invitation.table';

describe('Reprise des invitations en attente par l’email du compte', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let adminUserId: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    adminUserId = testResult.user.id;

    return async () => {
      await app.close();
    };
  });

  /** Un compte créé sans le lien du mail : ni collectivité, ni vérification. */
  const addCompteSansCollectivite = async () => {
    const { user } = await addTestUser(databaseService, {
      collectiviteId: undefined,
      verified: false,
    });
    return user;
  };

  const inviter = async ({
    email,
    collectiviteId = collectivite.id,
    role = CollectiviteRole.EDITION,
    active = true,
    createdAt,
  }: {
    email: string;
    collectiviteId?: number;
    role?: CollectiviteRole;
    active?: boolean;
    createdAt?: string;
  }) => {
    const [invitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        email,
        collectiviteId,
        role,
        active,
        createdBy: adminUserId,
        ...(createdAt ? { createdAt } : {}),
      })
      .returning();
    return invitation;
  };

  const consumePendings = (
    user: Awaited<ReturnType<typeof addTestUser>>['user']
  ) =>
    router
      .createCaller({ user: getAuthUserFromUserCredentials(user) })
      .collectivites.membres.invitations.consumePendings();

  const getDroits = (userId: string, collectiviteId: number) =>
    databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      );

  test('Reprend l’invitation adressée à l’email du compte, quelle que soit la casse', async () => {
    const compte = await addCompteSansCollectivite();
    const invitation = await inviter({
      email: compte.email.toUpperCase(),
      role: CollectiviteRole.LECTURE,
    });

    const reprises = await consumePendings(compte);

    expect(reprises).toEqual([
      { collectiviteId: collectivite.id, collectiviteType: collectivite.type },
    ]);

    const droits = await getDroits(compte.id, collectivite.id);
    expect(droits).toHaveLength(1);
    expect(droits[0]).toMatchObject({
      isActive: true,
      role: CollectiviteRole.LECTURE,
      invitationId: invitation.id,
    });

    const [invitationApres] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitation.id));
    expect(invitationApres.acceptedAt).not.toBeNull();
    expect(invitationApres.pending).toBe(false);

    const [verifie] = await databaseService.db
      .select()
      .from(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, compte.id));
    expect(verifie.verifie).toBe(true);

    // Une seconde connexion ne reprend plus rien.
    expect(await consumePendings(compte)).toEqual([]);
  });

  test('Ignore une invitation révoquée', async () => {
    const compte = await addCompteSansCollectivite();
    await inviter({ email: compte.email, active: false });

    expect(await consumePendings(compte)).toEqual([]);
    expect(await getDroits(compte.id, collectivite.id)).toHaveLength(0);
  });

  test('Ne reprend rien tant que l’email du compte n’est pas confirmé', async () => {
    const compte = await addCompteSansCollectivite();
    await databaseService.db
      .update(authUsersTable)
      .set({ emailConfirmedAt: null })
      .where(eq(authUsersTable.id, compte.id));
    const invitation = await inviter({ email: compte.email });

    expect(await consumePendings(compte)).toEqual([]);
    expect(await getDroits(compte.id, collectivite.id)).toHaveLength(0);

    const [invitationApres] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitation.id));
    expect(invitationApres.pending).toBe(true);
  });

  test('Ne reprend pas l’invitation d’une autre adresse', async () => {
    const compte = await addCompteSansCollectivite();
    await inviter({ email: `autre-${compte.email}` });

    expect(await consumePendings(compte)).toEqual([]);
    expect(await getDroits(compte.id, collectivite.id)).toHaveLength(0);
  });

  test('Deux invitations pour la même collectivité : un droit, au rôle de la plus récente', async () => {
    const compte = await addCompteSansCollectivite();
    const ancienne = await inviter({
      email: compte.email,
      role: CollectiviteRole.LECTURE,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const recente = await inviter({
      email: compte.email,
      role: CollectiviteRole.ADMIN,
      createdAt: '2026-06-01T00:00:00.000Z',
    });

    await consumePendings(compte);

    const droits = await getDroits(compte.id, collectivite.id);
    expect(droits).toHaveLength(1);
    expect(droits[0]).toMatchObject({
      role: CollectiviteRole.ADMIN,
      invitationId: recente.id,
    });

    const [ancienneApres] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, ancienne.id));
    expect(ancienneApres.pending).toBe(false);
  });

  test('Ouvre un service déconcentré, que l’agent ne peut pas rejoindre seul', async () => {
    const regionCode = await pickFreeRegionCode(
      databaseService,
      collectiviteTypeEnum.DREAL
    );
    const { collectivite: dreal, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          type: collectiviteTypeEnum.DREAL,
          regionCode,
          nom: `DREAL ${regionCode}`,
        },
      }
    );
    // Le droit référence l'invitation, qui référence la DREAL : dans cet ordre.
    onTestFinished(async () => {
      await databaseService.db
        .delete(utilisateurCollectiviteAccessTable)
        .where(eq(utilisateurCollectiviteAccessTable.collectiviteId, dreal.id));
      await databaseService.db
        .delete(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.id));
      await cleanup();
    });

    const compte = await addCompteSansCollectivite();
    await inviter({
      email: compte.email,
      collectiviteId: dreal.id,
      role: CollectiviteRole.ADMIN,
    });

    expect(await consumePendings(compte)).toEqual([
      {
        collectiviteId: dreal.id,
        collectiviteType: collectiviteTypeEnum.DREAL,
      },
    ]);
    expect(await getDroits(compte.id, dreal.id)).toHaveLength(1);
  });
});
