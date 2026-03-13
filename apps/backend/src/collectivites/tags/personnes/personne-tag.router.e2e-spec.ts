import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { TagEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { invitationTable } from '../../membres/invitation.table';

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

  test('Appelle liste en tant que visiteur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.collectivites.tags.personnes.list({
        collectiviteId: 200,
      })
    ).not.toThrow();
  });

  test('Appelle list', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    // Crée explicitement deux tags personnes pour la collectivité 1 via le router
    const createdTag1 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Test Tag 1',
      collectiviteId: 1,
    });
    const createdTag2 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Test Tag 2',
      collectiviteId: 1,
    });
    const tagIds = [createdTag1.id, createdTag2.id];

    // Crée une invitation via le router, avec les tags associés
    const invitationId = await caller.collectivites.membres.invitations.create({
      collectiviteId: 1,
      email: 'test@test.fr',
      role: CollectiviteRole.EDITION,
      tagIds,
    });

    onTestFinished(async () => {
      if (invitationId) {
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.id, invitationId));
      }

      tagIds.forEach(async (tagId) => {
        await caller.collectivites.tags.delete({
          tagType: TagEnum.Personne,
          collectiviteId: 1,
          id: tagId,
        });
      });
    });

    // Récupère les personne_tag créés pour la collectivité 1
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
      tagIds,
    });

    // Retourne les 2 personne_tags créés pour la collectivité 1
    expect(result.length).toBe(2);

    // Est-ce qu'il y a bien 2 tags ayant une invitation ?
    expect(result.filter((tag) => tag.email).length).toBe(2);

    // Récupère les deux tags créés
    const resultTwo = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
      tagIds,
    });
    // Retourne 2 tags ?
    expect(resultTwo.length).toBe(2);

    // Si on annule l'invitation, le tag ne doit plus avoir d'invitation associée
    await caller.collectivites.membres.invitations.deletePending({
      email: 'test@test.fr',
      collectiviteId: 1,
    });
    const resultAfter = await caller.collectivites.tags.personnes.list({
      collectiviteId: 1,
      tagIds: [tagIds[0]],
    });
    // Le tag ne doit plus avoir d'invitation associée
    expect(resultAfter.length).toBe(1);
    expect(resultAfter[0].email).toBeNull();
  });

  test('Appelle toUser sans avoir les droits', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.collectivites.tags.personnes.convertToUser({
        collectiviteId: 200,
        userId: yoloDodoUser.id,
        tagIds: [1, 3],
      })
    ).rejects.toThrowError();
  });

  test('convertToUser', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Crée explicitement deux tags personnes pour la collectivité 1 via le router
    const tag1 = await caller.collectivites.tags.create({
      tagType: 'personne',
      nom: 'Convert Tag 1',
      collectiviteId: 1,
    });
    const tag2 = await caller.collectivites.tags.create({
      tagType: 'personne',
      nom: 'Convert Tag 2',
      collectiviteId: 1,
    });

    // Crée deux fiches actions pour la collectivité 1
    const [fiche1] = await databaseService.db
      .insert(ficheActionTable)
      .values({ collectiviteId: 1, titre: 'Fiche convert 1' })
      .returning();
    const [fiche2] = await databaseService.db
      .insert(ficheActionTable)
      .values({ collectiviteId: 1, titre: 'Fiche convert 2' })
      .returning();

    // Ajoute des pilotes basés sur les tags créés
    await databaseService.db.insert(ficheActionPiloteTable).values([
      { ficheId: fiche1.id, tagId: tag1.id },
      { ficheId: fiche2.id, tagId: tag2.id },
    ]);

    // Vérifie avant la transformation qu'il y a bien 2 pilotes tag pour nos tags
    const pilotesBefore = await databaseService.db
      .select()
      .from(ficheActionPiloteTable);
    const tagPilotesBefore = pilotesBefore.filter(
      (p) => p.tagId === tag1.id || p.tagId === tag2.id
    ).length;
    expect(tagPilotesBefore).toBe(2);

    // Lance la transformation pour nos tags
    await caller.collectivites.tags.personnes.convertToUser({
      collectiviteId: 1,
      userId: yoloDodoUser.id,
      tagIds: [tag1.id, tag2.id],
    });

    // Vérifie après la transformation
    const pilotesAfter = await databaseService.db
      .select()
      .from(ficheActionPiloteTable);

    // Il n'y a plus de pilotes tag pour nos tags
    const tagPilotesAfter = pilotesAfter.filter(
      (p) => p.tagId === tag1.id || p.tagId === tag2.id
    ).length;
    expect(tagPilotesAfter).toBe(0);

    // Les fiches ont maintenant un pilote utilisateur correspondant à yoloDodoUser
    const userPilotesForUser = pilotesAfter.filter(
      (p) =>
        p.userId === yoloDodoUser.id &&
        (p.ficheId === fiche1.id || p.ficheId === fiche2.id)
    ).length;
    expect(userPilotesForUser).toBe(2);

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionPiloteTable)
          .where(
            inArray(ficheActionPiloteTable.ficheId, [fiche1.id, fiche2.id])
          );
        await databaseService.db
          .delete(ficheActionReferentTable)
          .where(
            inArray(ficheActionReferentTable.ficheId, [fiche1.id, fiche2.id])
          );
        await databaseService.db
          .delete(ficheActionTable)
          .where(inArray(ficheActionTable.id, [fiche1.id, fiche2.id]));
        await databaseService.db
          .delete(personneTagTable)
          .where(inArray(personneTagTable.id, [tag1.id, tag2.id]));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });
});
