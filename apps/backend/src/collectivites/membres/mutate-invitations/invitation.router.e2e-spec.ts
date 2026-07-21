import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { utilisateurCollectiviteAccessTable } from '../../../users/authorizations/utilisateur-collectivite-access.table';
import { invitationTable } from '../invitation.table';
import { invitationPersonneTagTable } from './invitation-personne-tag.table';

describe('Test les invitations', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let adminEmail: string;
  let adminUserId: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    // Create collectivite with admin user
    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(testResult.user);
    adminEmail = testResult.user.email ?? '';
    adminUserId = testResult.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test(`N'a pas le droit d'inviter`, async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(() =>
      caller.collectivites.membres.invitations.create({
        collectiviteId: 99999,
        email: 'test@test.fr',
        role: CollectiviteRole.EDITION,
        tagIds: [],
      })
    ).rejects.toThrowError();
  });

  test(`Utilisateur déjà dans la collectivité`, async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(() =>
      caller.collectivites.membres.invitations.create({
        collectiviteId: collectivite.id,
        email: adminEmail,
        role: CollectiviteRole.EDITION,
        tagIds: [],
      })
    ).rejects.toThrowError(
      `L'utilisateur ${adminEmail} est déjà associé à la collectivité ${collectivite.id}`
    );
  });

  test(`Invite un utilisateur déjà existant mais pas rattaché à la collectivité`, async () => {
    // Create user to be invited (not in collectivite)
    const { user: invitedUser } = await addTestUser(databaseService, {
      verified: false,
    });

    const adminCaller = router.createCaller({ user: adminUser });

    // Create tag and fiches for this test
    const [testTag] = await databaseService.db
      .insert(personneTagTable)
      .values({ nom: 'Pilote Tag Invite', collectiviteId: collectivite.id })
      .returning();

    const fiche1 = await adminCaller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche invite test 1' },
    });
    const fiche2 = await adminCaller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche invite test 2' },
    });

    await databaseService.db.insert(ficheActionPiloteTable).values([
      { ficheId: fiche1.id, tagId: testTag.id },
      { ficheId: fiche2.id, tagId: testTag.id },
    ]);

    // Vérifie que l'utilisateur n'est pas vérifié
    const [verifAvant] = await databaseService.db
      .select()
      .from(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, invitedUser.id))
      .limit(1);

    expect(verifAvant?.verifie).toBe(false);

    // Vérifie que l'invité n'appartient pas à la collectivité
    const avantInvitation = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, invitedUser.id),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectivite.id)
        )
      );
    expect(avantInvitation.length).toBe(0);

    // Invite l'utilisateur
    const invitation =
      await adminCaller.collectivites.membres.invitations.create({
        collectiviteId: collectivite.id,
        email: invitedUser.email,
        role: CollectiviteRole.EDITION,
        tagIds: [testTag.id],
      });
    expect(invitation).toBeNull();

    // Vérifie que l'utilisateur est vérifié après avoir été invité
    const [verifApres] = await databaseService.db
      .select()
      .from(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, invitedUser.id))
      .limit(1);

    expect(verifApres?.verifie).toBe(true);

    const apresInvitation = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, invitedUser.id),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectivite.id)
        )
      );
    expect(apresInvitation.length).toBe(1);

    // Vérifie que le tag a été remplacé par l'utilisateur (pilotes)
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(eq(ficheActionPiloteTable.userId, invitedUser.id));
    expect(pilotes.length).toBe(2);
  });

  test(`Invite un nouvel utilisateur`, async () => {
    const caller = router.createCaller({ user: adminUser });

    // Create 2 tags for this test
    const [tag1] = await databaseService.db
      .insert(personneTagTable)
      .values({
        nom: 'Tag Invite New 1',
        collectiviteId: collectivite.id,
      })
      .returning();
    const [tag2] = await databaseService.db
      .insert(personneTagTable)
      .values({
        nom: 'Tag Invite New 2',
        collectiviteId: collectivite.id,
      })
      .returning();

    // Invite l'utilisateur test
    const invitation = await caller.collectivites.membres.invitations.create({
      collectiviteId: collectivite.id,
      email: 'newuser-invite-test@test.fr',
      role: CollectiviteRole.EDITION,
      tagIds: [tag1.id, tag2.id],
    });
    // Retourne l'identifiant de l'invitation
    expect(invitation).not.toBeNull();

    if (!invitation) {
      expect.fail('Invitation is null');
    }

    // Vérifie que l'invitation existe
    const [result] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitation));

    expect(result).not.toBeNull();

    // Vérifie que l'invitation contient les 2 tags
    const tags = await databaseService.db
      .select()
      .from(invitationPersonneTagTable)
      .where(eq(invitationPersonneTagTable.invitationId, invitation));

    expect(tags.length).toBe(2);
  });

  test(`Consomme l'invitation`, async () => {
    const caller = router.createCaller({ user: adminUser });

    // Create tag and fiches for this test
    const [testTag] = await databaseService.db
      .insert(personneTagTable)
      .values({
        nom: 'Tag Consume Test',
        collectiviteId: collectivite.id,
      })
      .returning();

    const fiche1 = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche consume test 1',
      },
    });
    const fiche2 = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche consume test 2',
      },
    });

    await databaseService.db.insert(ficheActionPiloteTable).values([
      { ficheId: fiche1.id, tagId: testTag.id },
      { ficheId: fiche2.id, tagId: testTag.id },
    ]);

    const condition = and(
      eq(utilisateurCollectiviteAccessTable.userId, adminUserId),
      eq(utilisateurCollectiviteAccessTable.collectiviteId, collectivite.id)
    );

    // Enlève l'admin de la collectivité
    await databaseService.db
      .delete(utilisateurCollectiviteAccessTable)
      .where(condition);

    // Crée l'invitation et l'associe au tag
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.ADMIN,
        email: adminEmail,
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
      })
      .returning();

    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: testTag.id,
      invitationId: invitationAdded.id,
      tagNom: testTag.nom,
    });

    // Consume l'invitation
    await caller.collectivites.membres.invitations.consume({
      invitationId: invitationAdded.id,
    });

    // Vérifie que l'invitation est consommée
    const [invit] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationAdded.id))
      .limit(1);

    expect(invit.consumed).toBe(true);

    // Vérifie que l'admin réappartient à la collectivité
    const permissions = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(condition);

    expect(permissions.length).toBe(1);

    // Vérifie que les tags sont associés (pilotes)
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(eq(ficheActionPiloteTable.userId, adminUserId));

    expect(pilotes.length).toBeGreaterThanOrEqual(2);
  });

  test(`Refuse de consommer une invitation inexistante`, async () => {
    const caller = router.createCaller({ user: adminUser });

    await expect(() =>
      caller.collectivites.membres.invitations.consume({
        invitationId: crypto.randomUUID(),
      })
    ).rejects.toThrow(/n'existe pas/);
  });

  test(`Consomme une invitation malgré une casse différente entre JWT et email en base`, async () => {
    // Fresh fixtures: no auth.users cleanup (FK scans on indicateur_valeur timeout).
    const { user: invitee } = await addTestUser(databaseService, {
      collectiviteId: undefined,
      verified: false,
    });

    const [invitationRow] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.LECTURE,
        email: 'CaseSensitive.Local@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
      })
      .returning();

    const inviteeCaller = router.createCaller({
      user: getAuthUserFromUserCredentials({
        id: invitee.id,
        email: 'casesensitive.local@test.fr',
      }),
    });

    await inviteeCaller.collectivites.membres.invitations.consume({
      invitationId: invitationRow.id,
    });

    const access = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, invitee.id),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectivite.id)
        )
      );

    expect(access.length).toBe(1);
  });

  test(`Refuse de consommer une invitation avec un email différent`, async () => {
    // Fresh fixtures: no auth.users cleanup (FK scans on indicateur_valeur timeout).
    const { user: wrongUser } = await addTestUser(databaseService);

    const [invitationRow] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.LECTURE,
        email: 'only-for-invited@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(invitationTable)
        .where(eq(invitationTable.id, invitationRow.id));
    });

    const wrongCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(wrongUser),
    });

    await expect(() =>
      wrongCaller.collectivites.membres.invitations.consume({
        invitationId: invitationRow.id,
      })
    ).rejects.toThrow(/ne peut être consommée que par/);
  });

  test(`Supprime une invitation en attente`, async () => {
    const caller = router.createCaller({ user: adminUser });

    // Crée une invitation en attente
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.EDITION,
        email: 'pending-delete@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
        active: true,
      })
      .returning();

    // Vérifie que l'invitation existe et est active
    const [invitationBefore] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationAdded.id))
      .limit(1);

    expect(invitationBefore.active).toBe(true);
    expect(invitationBefore.pending).toBe(true);

    // Supprime l'invitation en attente
    const wasDeleted =
      await caller.collectivites.membres.invitations.deletePending({
        email: 'pending-delete@test.fr',
        collectiviteId: collectivite.id,
      });

    expect(wasDeleted).toBe(true);

    // Vérifie que l'invitation est maintenant inactive
    const [invitationAfter] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationAdded.id))
      .limit(1);

    expect(invitationAfter.active).toBe(false);
  });

  test(`Tentative de suppression d'une invitation inexistante`, async () => {
    const caller = router.createCaller({ user: adminUser });

    const wasDeleted =
      await caller.collectivites.membres.invitations.deletePending({
        email: 'nonexistent@test.fr',
        collectiviteId: collectivite.id,
      });

    expect(wasDeleted).toBe(false);
  });

  test(`Tentative de suppression d'une invitation sans les droits`, async () => {
    const caller = router.createCaller({ user: adminUser });

    await expect(() =>
      caller.collectivites.membres.invitations.deletePending({
        email: 'test@test.fr',
        collectiviteId: 999999,
      })
    ).rejects.toThrowError();
  });

  test(`Ne peut pas inviter avec un tag déjà utilisé par une autre invitation en attente`, async () => {
    const caller = router.createCaller({ user: adminUser });

    // Create tag for this test
    const [conflictTag] = await databaseService.db
      .insert(personneTagTable)
      .values({
        nom: 'Tag Conflict Test',
        collectiviteId: collectivite.id,
      })
      .returning();

    // Crée une première invitation avec le tag
    const [firstInvitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.EDITION,
        email: 'first-conflict@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
        active: true,
      })
      .returning();

    // Associe le tag à la première invitation
    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: conflictTag.id,
      invitationId: firstInvitation.id,
      tagNom: conflictTag.nom,
    });

    // Tente de créer une deuxième invitation avec le même tag
    await expect(() =>
      caller.collectivites.membres.invitations.create({
        collectiviteId: collectivite.id,
        email: 'second-conflict@test.fr',
        role: CollectiviteRole.EDITION,
        tagIds: [conflictTag.id],
      })
    ).rejects.toThrowError(
      `Les tags suivants sont déjà utilisés par d'autres invitations en attente : ${conflictTag.nom}`
    );
  });

  test(`Peut inviter avec un tag après suppression de l'invitation qui l'utilisait`, async () => {
    const caller = router.createCaller({ user: adminUser });

    // Create tag for this test
    const [freedTag] = await databaseService.db
      .insert(personneTagTable)
      .values({
        nom: 'Tag Freed Test',
        collectiviteId: collectivite.id,
      })
      .returning();

    // Crée une première invitation avec le tag
    const [firstInvitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.EDITION,
        email: 'first-freed@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
        active: true,
      })
      .returning();

    // Associe le tag à la première invitation
    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: freedTag.id,
      invitationId: firstInvitation.id,
      tagNom: freedTag.nom,
    });

    // Supprime la première invitation (désactive l'invitation)
    await databaseService.db
      .update(invitationTable)
      .set({ active: false })
      .where(eq(invitationTable.id, firstInvitation.id));

    // Maintenant on peut créer une nouvelle invitation avec le même tag
    const secondInvitation =
      await caller.collectivites.membres.invitations.create({
        collectiviteId: collectivite.id,
        email: 'second-freed@test.fr',
        role: CollectiviteRole.EDITION,
        tagIds: [freedTag.id],
      });

    expect(secondInvitation).not.toBeNull();
  });
});

describe('Test envoi des emails d’invitation', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let adminUserId: string;
  let sendEmailSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(testResult.user);
    adminUserId = testResult.user.id;

    const emailService = app.get(EmailService);
    sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    });
  });

  afterAll(async () => {
    sendEmailSpy.mockRestore();
    await app.close();
  });

  beforeEach(() => {
    sendEmailSpy.mockClear();
  });

  test(`Envoie un mail d'invitation à partir de l'id opaque`, async () => {
    const caller = router.createCaller({ user: adminUser });
    const invitationEmail = `send-invite-${Date.now()}@test.fr`;

    const invitationId = await caller.collectivites.membres.invitations.create({
      collectiviteId: collectivite.id,
      email: invitationEmail,
      role: CollectiviteRole.EDITION,
      tagIds: [],
    });

    if (!invitationId) {
      expect.fail('Invitation ID is null');
    }

    const result = await caller.collectivites.membres.invitations.send({
      urlType: 'invitation',
      invitationId,
    });

    expect(result).toEqual({ messageId: 'test-message-id' });
    expect(sendEmailSpy).toHaveBeenCalledOnce();
    const [emailArg] = sendEmailSpy.mock.calls[0];
    expect(emailArg.to).toBe(invitationEmail);
    expect(emailArg.subject).toContain(collectivite.nom);
    expect(emailArg.html).toContain(`/invitation/${invitationId}`);
    expect(emailArg.html).not.toContain(encodeURIComponent(invitationEmail));
  });

  test(`Envoie un mail de rattachement pour un utilisateur existant`, async () => {
    const caller = router.createCaller({ user: adminUser });
    const { user: existingUser } = await addTestUser(databaseService);

    const result = await caller.collectivites.membres.invitations.send({
      urlType: 'rattachement',
      collectiviteId: collectivite.id,
      to: existingUser.email,
    });

    expect(result).toEqual({ messageId: 'test-message-id' });
    expect(sendEmailSpy).toHaveBeenCalledOnce();
    const [emailArg] = sendEmailSpy.mock.calls[0];
    expect(emailArg.to).toBe(existingUser.email.toLowerCase());
    expect(emailArg.html).toContain(`/collectivite/${collectivite.id}/accueil`);
  });

  test(`Refuse l'envoi sans droit sur la collectivité`, async () => {
    const { user: outsider } = await addTestUser(databaseService);
    const outsiderAuth = getAuthUserFromUserCredentials(outsider);
    const caller = router.createCaller({ user: outsiderAuth });

    const [invitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.EDITION,
        email: `no-rights-${Date.now()}@test.fr`,
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
        active: true,
      })
      .returning();

    await expect(
      caller.collectivites.membres.invitations.send({
        urlType: 'invitation',
        invitationId: invitation.id,
      })
    ).rejects.toThrow();
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  test(`Refuse l'envoi d'une invitation inexistante`, async () => {
    const caller = router.createCaller({ user: adminUser });

    await expect(
      caller.collectivites.membres.invitations.send({
        urlType: 'invitation',
        invitationId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow();
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });
});
