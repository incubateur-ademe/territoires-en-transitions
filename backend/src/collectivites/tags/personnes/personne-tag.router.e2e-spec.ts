import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@/backend/test';
import { invitationTable } from '@/backend/auth/models/invitation.table';
import { PermissionLevel } from '@/backend/auth/authorizations/roles/niveau-acces.enum';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { eq, inArray, isNotNull, ne } from 'drizzle-orm';
import { invitationPersonneTagTable } from '@/backend/auth/invitation/invitation-personne-tag.table';
import { onTestFinished } from 'vitest';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';

describe('Test PersonneTagService', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
  });

  test('Appelle list sans avoir les droits', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.collectivites.tags.personnes.list({
        collectiviteId: 200,
      })
    ).rejects.toThrowError();
  });

  test('Appelle list', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    // Créé une invitation
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        niveau: PermissionLevel.EDITION,
        email: 'test@test.fr',
        collectiviteId: 1,
        createdBy: yoloDodoUser.id,
      })
      .returning();
    // Ajoute des tags à l'invitation
    const tagsToAdd = await databaseService.db
      .select()
      .from(personneTagTable)
      .where(inArray(personneTagTable.id, [1, 3]));

    await databaseService.db.insert(invitationPersonneTagTable).values(
      tagsToAdd.map((tag) => ({
        tagId: tag.id,
        invitationId: invitationAdded.id,
        tagNom: tag.nom,
      }))
    );

    // Récupère les personne_tag de la collectivité 1
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
    });
    // Retourne tous les personne_tags de la collectivité 1 ?
    expect(result.length).toBe(4);
    // Est-ce qu'il y a bien 2 tags ayant une invitation ?
    expect(result.filter((tag) => tag.email).length).toBe(2);

    // Récupère les personne_tag 1 et 9
    const resultTwo = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
      tagIds: [1, 9],
    });
    // Retourne 2 tags ?
    expect(resultTwo.length).toBe(2);

    // Récupère le personne_tag 1
    const [resultOne] = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
      tagIds: [1],
    });
    // Le tag est bien pilote de 2 fiches ?
    expect(resultOne.nbFicheActionPilotes).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.collectiviteId, 1));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  test('Appelle toUser sans avoir les droits', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.collectivites.tags.personnes.toUser({
        collectiviteId: 200,
        userId: yoloDodoUser.id,
        tagIds: [1, 3],
      })
    ).rejects.toThrowError();
  });

  test('Test toUser', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Vérifie avant la transformation
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable);
    // Il y a bien 1 pilote utilisateur ?
    expect(pilotes.filter((p) => p.userId).length).toBe(1);
    // Il y a bien 4 pilotes tags ?
    expect(pilotes.filter((p) => p.tagId).length).toBe(4);

    // Lance la transformation
    await caller.collectivites.tags.personnes.toUser({
      collectiviteId: 1,
      userId: yoloDodoUser.id,
      tagIds: [1, 3],
    });

    // Vérifie après la transformation
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
    });
    // Il y a bien 2 tags personnes ? (anciennement 4)
    expect(result.length).toBe(2);
    const pilotesAfter = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(isNotNull(ficheActionPiloteTable.userId));
    // Il y a bien 4 pilotes utilisateurs ?
    expect(pilotesAfter.filter((p) => p.userId).length).toBe(4); // yolododo est déjà pilote de la fiche 1
    // Il n'y a plus de pilote tag ?
    expect(pilotesAfter.filter((p) => p.tagId).length).toBe(0);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionPiloteTable)
          .where(ne(ficheActionPiloteTable.ficheId, 1));
        await databaseService.db
          .delete(ficheActionReferentTable)
          .where(ne(ficheActionReferentTable.ficheId, 2));
        await databaseService.db
          .update(personneTagTable)
          .set({ associatedUserId: null })
          .where(inArray(personneTagTable.id, [1, 3]));
        await databaseService.db.insert(ficheActionPiloteTable).values([
          { ficheId: 1, tagId: 1 },
          { ficheId: 2, tagId: 1 },
          { ficheId: 3, tagId: 3 },
          { ficheId: 4, tagId: 3 },
        ]);
        await databaseService.db.insert(ficheActionReferentTable).values([
          { ficheId: 1, tagId: 3 },
          { ficheId: 4, tagId: 1 },
          { ficheId: 5, tagId: 3 },
          { ficheId: 6, tagId: 3 },
        ]);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });
});
