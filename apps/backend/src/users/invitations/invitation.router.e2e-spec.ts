import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { invitationPersonneTagTable } from '@tet/backend/users/invitations/invitation-personne-tag.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { invitationTable } from '@tet/backend/users/models/invitation.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNotNull, ne } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { utilisateurCollectiviteAccessTable } from '../authorizations/utilisateur-collectivite-access.table';

describe('Test les invitations', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
  });

  test(`N'a pas le droit d'inviter`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.users.invitations.create({
        collectiviteId: 200,
        email: 'test@test.fr',
        accessLevel: CollectiviteRole.EDITION,
        tagIds: [10],
      })
    ).rejects.toThrowError();
  });

  test(`Utilisateur déjà dans la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.users.invitations.create({
        collectiviteId: 1,
        email: 'yolo@dodo.com',
        accessLevel: CollectiviteRole.EDITION,
        tagIds: [10],
      })
    ).rejects.toThrowError(
      `L'utilisateur yolo@dodo.com est déjà associé à la collectivité 1`
    );
  });

  test(`Invite un utilisateur déjà existant mais pas rattaché à la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    // Récupère l'id de l'utilisateur à rattacher
    const [yulu] = await databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.email, 'yulu@dudu.com'))
      .limit(1);

    // Vérifie que yulu n'appartient pas à la collectivité 1
    const avantInvitation = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, yulu.id),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, 1)
        )
      );

    expect(avantInvitation.length).toBe(0);

    // Invite yulu
    const invitation = await caller.users.invitations.create({
      collectiviteId: 1,
      email: 'yulu@dudu.com',
      accessLevel: CollectiviteRole.EDITION,
      tagIds: [1],
    });
    // Retourne null quand il y a un rattachement sans création d'invitation
    expect(invitation).toBeNull();

    // Vérifie que yulu est rattaché à la collectivité 1
    const apresInvitation = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, yulu.id),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, 1)
        )
      );
    expect(apresInvitation.length).toBe(1);

    // Vérifie que le tag 1 a été remplacé par yulu
    // (mieux testé dans personne-tag.router.e2e-spec.ts)
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(eq(ficheActionPiloteTable.userId, yulu.id));
    expect(pilotes.length).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(utilisateurCollectiviteAccessTable)
          .where(
            and(
              eq(utilisateurCollectiviteAccessTable.userId, yulu.id),
              eq(utilisateurCollectiviteAccessTable.collectiviteId, 1)
            )
          );
        await databaseService.db
          .delete(ficheActionPiloteTable)
          .where(eq(ficheActionPiloteTable.userId, yulu.id));
        await databaseService.db
          .delete(ficheActionReferentTable)
          .where(eq(ficheActionReferentTable.userId, yulu.id));
        await databaseService.db
          .insert(personneTagTable)
          .values([{ id: 1, nom: 'Lou Piote', collectiviteId: 1 }]);
        await databaseService.db.insert(ficheActionPiloteTable).values([
          { ficheId: 1, tagId: 1 },
          { ficheId: 2, tagId: 1 },
        ]);
        await databaseService.db
          .insert(ficheActionReferentTable)
          .values([{ ficheId: 4, tagId: 1 }]);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test(`Invite un nouvel utilisateur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Invite l'utilisateur test
    const invitation = await caller.users.invitations.create({
      collectiviteId: 1,
      email: 'test@test.fr',
      accessLevel: CollectiviteRole.EDITION,
      tagIds: [1, 10],
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

    // Vérifie que l'invitation contient le tag 1
    const tags = await databaseService.db
      .select()
      .from(invitationPersonneTagTable)
      .where(eq(invitationPersonneTagTable.invitationId, invitation));

    expect(tags.length).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .update(utilisateurCollectiviteAccessTable)
          .set({ invitationId: null })
          .where(
            eq(utilisateurCollectiviteAccessTable.userId, yoloDodoUser.id)
          );
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.collectiviteId, 1));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test(`Consomme l'invitation`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const condition = and(
      eq(utilisateurCollectiviteAccessTable.userId, yoloDodoUser.id),
      eq(utilisateurCollectiviteAccessTable.collectiviteId, 1)
    );
    // Enlève yolododo de la collectivité 1
    await databaseService.db
      .delete(utilisateurCollectiviteAccessTable)
      .where(condition);

    // Crée l'invitation et l'associe au tag 1
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        accessLevel: CollectiviteRole.ADMIN,
        email: 'yolo@dodo.com',
        collectiviteId: 1,
        createdBy: yoloDodoUser.id,
      })
      .returning();
    // Ajoute un tag à l'invitation
    const [tagToAdd] = await databaseService.db
      .select()
      .from(personneTagTable)
      .where(eq(personneTagTable.id, 1));

    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: tagToAdd.id,
      invitationId: invitationAdded.id,
      tagNom: tagToAdd.nom,
    });

    // Consume l'invitation
    await caller.users.invitations.consume({
      invitationId: invitationAdded.id,
    });

    // Vérifie que l'invitation est consommée
    const [invit] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationAdded.id))
      .limit(1);

    expect(invit.consumed).toBe(true);

    // Vérifie que yolodo réappartient à la collectivité 1
    const permissions = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(condition);

    expect(permissions.length).toBe(1);

    // Vérifie que les tags lui sont associés
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(eq(ficheActionPiloteTable.userId, yoloDodoUser.id));
    expect(pilotes.length).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionPiloteTable)
          .where(
            and(
              ne(ficheActionPiloteTable.ficheId, 1),
              isNotNull(ficheActionPiloteTable.userId)
            )
          );
        await databaseService.db
          .delete(ficheActionReferentTable)
          .where(
            and(
              ne(ficheActionReferentTable.ficheId, 2),
              isNotNull(ficheActionReferentTable.userId)
            )
          );
        await databaseService.db
          .insert(personneTagTable)
          .values([{ id: 1, nom: 'Lou Piote', collectiviteId: 1 }]);
        await databaseService.db.insert(ficheActionPiloteTable).values([
          { ficheId: 1, tagId: 1 },
          { ficheId: 2, tagId: 1 },
        ]);
        await databaseService.db
          .insert(ficheActionReferentTable)
          .values([{ ficheId: 4, tagId: 1 }]);
        await databaseService.db
          .update(utilisateurCollectiviteAccessTable)
          .set({ invitationId: null })
          .where(
            eq(utilisateurCollectiviteAccessTable.userId, yoloDodoUser.id)
          );
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.collectiviteId, 1));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test(`Supprime une invitation en attente`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée une invitation en attente
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        accessLevel: CollectiviteRole.EDITION,
        email: 'pending@test.fr',
        collectiviteId: 1,
        createdBy: yoloDodoUser.id,
        active: true,
      })
      .returning();

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.id, invitationAdded.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });

    // Vérifie que l'invitation existe et est active
    const [invitationBefore] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationAdded.id))
      .limit(1);

    expect(invitationBefore.active).toBe(true);
    expect(invitationBefore.pending).toBe(true);

    // Supprime l'invitation en attente
    const wasDeleted = await caller.users.invitations.deletePending({
      email: 'pending@test.fr',
      collectiviteId: 1,
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
    const caller = router.createCaller({ user: yoloDodoUser });

    const wasDeleted = await caller.users.invitations.deletePending({
      email: 'nonexistent@test.fr',
      collectiviteId: 1,
    });

    expect(wasDeleted).toBe(false);
  });

  test(`Tentative de suppression d'une invitation sans les droits`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.users.invitations.deletePending({
        email: 'test@test.fr',
        collectiviteId: 999, // Collectivité inexistante ou sans droits
      })
    ).rejects.toThrowError();
  });

  test(`Ne peut pas inviter avec un tag déjà utilisé par une autre invitation en attente`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée une première invitation avec le tag 1
    const [firstInvitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        accessLevel: CollectiviteRole.EDITION,
        email: 'first@test.fr',
        collectiviteId: 1,
        createdBy: yoloDodoUser.id,
        active: true,
      })
      .returning();

    // Associe le tag 1 à la première invitation
    const [tagToAdd] = await databaseService.db
      .select()
      .from(personneTagTable)
      .where(eq(personneTagTable.id, 1));

    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: tagToAdd.id,
      invitationId: firstInvitation.id,
      tagNom: tagToAdd.nom,
    });

    // Tente de créer une deuxième invitation avec le même tag
    await expect(() =>
      caller.users.invitations.create({
        collectiviteId: 1,
        email: 'second@test.fr',
        accessLevel: CollectiviteRole.EDITION,
        tagIds: [1], // Même tag que la première invitation
      })
    ).rejects.toThrowError(
      `Les tags suivants sont déjà utilisés par d'autres invitations en attente : ${tagToAdd.nom}`
    );

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(invitationPersonneTagTable)
          .where(
            eq(invitationPersonneTagTable.invitationId, firstInvitation.id)
          );
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.id, firstInvitation.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test(`Peut inviter avec un tag après suppression de l'invitation qui l'utilisait`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée une première invitation avec le tag 1
    const [firstInvitation] = await databaseService.db
      .insert(invitationTable)
      .values({
        accessLevel: CollectiviteRole.EDITION,
        email: 'first@test.fr',
        collectiviteId: 1,
        createdBy: yoloDodoUser.id,
        active: true,
      })
      .returning();

    // Associe le tag 1 à la première invitation
    const [tagToAdd] = await databaseService.db
      .select()
      .from(personneTagTable)
      .where(eq(personneTagTable.id, 1));

    await databaseService.db.insert(invitationPersonneTagTable).values({
      tagId: tagToAdd.id,
      invitationId: firstInvitation.id,
      tagNom: tagToAdd.nom,
    });

    // Supprime la première invitation (désactive l'invitation)
    await databaseService.db
      .update(invitationTable)
      .set({ active: false })
      .where(eq(invitationTable.id, firstInvitation.id));

    // Maintenant on peut créer une nouvelle invitation avec le même tag
    const secondInvitation = await caller.users.invitations.create({
      collectiviteId: 1,
      email: 'second@test.fr',
      accessLevel: CollectiviteRole.EDITION,
      tagIds: [1], // Même tag, mais l'invitation précédente est inactive
    });

    expect(secondInvitation).not.toBeNull();

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(invitationPersonneTagTable)
          .where(
            eq(invitationPersonneTagTable.invitationId, firstInvitation.id)
          );
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.id, firstInvitation.id));
        if (secondInvitation) {
          await databaseService.db
            .delete(invitationPersonneTagTable)
            .where(
              eq(invitationPersonneTagTable.invitationId, secondInvitation)
            );
          await databaseService.db
            .delete(invitationTable)
            .where(eq(invitationTable.id, secondInvitation));
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });
});
