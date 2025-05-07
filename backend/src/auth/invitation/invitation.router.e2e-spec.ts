import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@/backend/test';
import { PermissionLevel } from '@/backend/auth/authorizations/roles/niveau-acces.enum';
import { invitationTable } from '@/backend/auth/models/invitation.table';
import { utilisateurPermissionTable } from '@/backend/auth/authorizations/roles/private-utilisateur-droit.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { onTestFinished } from 'vitest';
import { and, eq, isNotNull, ne } from 'drizzle-orm';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { invitationPersonneTagTable } from '@/backend/auth/invitation/invitation-personne-tag.table';
import { dcpTable } from '@/backend/auth/models/dcp.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';

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
      caller.invitations.create({
        collectiviteId: 200,
        email: 'test@test.fr',
        niveau: PermissionLevel.EDITION,
        tagIds: [10],
      })
    ).rejects.toThrowError();
  });

  test(`Utilisateur déjà dans la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.invitations.create({
        collectiviteId: 1,
        email: 'yolo@dodo.com',
        niveau: PermissionLevel.EDITION,
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
      .from(utilisateurPermissionTable)
      .where(
        and(
          eq(utilisateurPermissionTable.userId, yulu.userId),
          eq(utilisateurPermissionTable.collectiviteId, 1)
        )
      );

    expect(avantInvitation.length).toBe(0);

    // Invite yulu
    const invitation = await caller.invitations.create({
      collectiviteId: 1,
      email: 'yulu@dudu.com',
      niveau: PermissionLevel.EDITION,
      tagIds: [1],
    });
    // Retourne null quand il y a un rattachement sans création d'invitation
    expect(invitation).toBeNull();

    // Vérifie que yulu est rattaché à la collectivité 1
    const apresInvitation = await databaseService.db
      .select()
      .from(utilisateurPermissionTable)
      .where(
        and(
          eq(utilisateurPermissionTable.userId, yulu.userId),
          eq(utilisateurPermissionTable.collectiviteId, 1)
        )
      );
    expect(apresInvitation.length).toBe(1);

    // Vérifie que le tag 1 a été remplacé par yulu
    // (mieux testé dans personne-tag.router.e2e-spec.ts)
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(eq(ficheActionPiloteTable.userId, yulu.userId));
    expect(pilotes.length).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(utilisateurPermissionTable)
          .where(
            and(
              eq(utilisateurPermissionTable.userId, yulu.userId),
              eq(utilisateurPermissionTable.collectiviteId, 1)
            )
          );
        await databaseService.db
          .delete(ficheActionPiloteTable)
          .where(eq(ficheActionPiloteTable.userId, yulu.userId));
        await databaseService.db
          .delete(ficheActionReferentTable)
          .where(eq(ficheActionReferentTable.userId, yulu.userId));
        await databaseService.db
          .update(personneTagTable)
          .set({associatedUserId : null})
          .where(eq(personneTagTable.id, 1));
        await databaseService.db.insert(ficheActionPiloteTable).values([
          { ficheId: 1, tagId: 1 },
          { ficheId: 2, tagId: 1 },
        ]);
        await databaseService.db.insert(ficheActionReferentTable).values([
          { ficheId: 4, tagId: 1 },
        ]);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test(`Invite un nouvel utilisateur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Invite l'utilisateur test
    const invitation = await caller.invitations.create({
      collectiviteId: 1,
      email: 'test@test.fr',
      niveau: PermissionLevel.EDITION,
      tagIds: [1, 10],
    });
    // Retourne l'identifiant de l'invitation
    expect(invitation).not.toBeNull();

    // Vérifie que l'invitation existe
    const [result] = await databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitation!));

    expect(result).not.toBeNull();

    // Vérifie que l'invitation contient le tag 1
    const tags = await databaseService.db
      .select()
      .from(invitationPersonneTagTable)
      .where(eq(invitationPersonneTagTable.invitationId, invitation!));

    expect(tags.length).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .update(utilisateurPermissionTable)
          .set({ invitationId: null })
          .where(eq(utilisateurPermissionTable.userId, yoloDodoUser.id));
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
      eq(utilisateurPermissionTable.userId, yoloDodoUser.id),
      eq(utilisateurPermissionTable.collectiviteId, 1)
    );
    // Enlève yolododo de la collectivité 1
    await databaseService.db
      .delete(utilisateurPermissionTable)
      .where(condition);

    // Crée l'invitation et l'associe au tag 1
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        niveau: PermissionLevel.ADMIN,
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
    await caller.invitations.consume({ invitationId: invitationAdded.id });

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
      .from(utilisateurPermissionTable)
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
          .update(personneTagTable)
          .set({associatedUserId : null})
          .where(eq(personneTagTable.id, 1));
        await databaseService.db.insert(ficheActionPiloteTable).values([
          { ficheId: 1, tagId: 1 },
          { ficheId: 2, tagId: 1 },
        ]);
        await databaseService.db.insert(ficheActionReferentTable).values([
          { ficheId: 4, tagId: 1 },
        ]);
        await databaseService.db
          .update(utilisateurPermissionTable)
          .set({ invitationId: null })
          .where(eq(utilisateurPermissionTable.userId, yoloDodoUser.id));
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.collectiviteId, 1));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });
});
