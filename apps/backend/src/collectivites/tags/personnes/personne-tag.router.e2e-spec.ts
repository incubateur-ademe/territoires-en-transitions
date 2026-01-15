import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, TagEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { invitationTable } from '../../membres/invitation.table';

describe('Test PersonneTagService', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let adminUser: AuthenticatedUser;
  let adminUserId: string;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;

  // Tags
  let tag1Id: number;
  // tag2Id est créé uniquement pour avoir 4 tags dans la collectivité (non référencé ensuite)
  let _tag2Id: number;
  let tag3Id: number;
  let _tag4Id: number;

  // Fiches
  let ficheIds: number[];

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
    adminUserId = testResult.user.id;

    const caller = router.createCaller({ user: adminUser });

    // Create 4 personne tags
    const [t1] = await databaseService.db
      .insert(personneTagTable)
      .values({ nom: 'Lou Piote Test', collectiviteId: collectivite.id })
      .returning();
    const [t2] = await databaseService.db
      .insert(personneTagTable)
      .values({ nom: 'Mia Réfé Test', collectiviteId: collectivite.id })
      .returning();
    const [t3] = await databaseService.db
      .insert(personneTagTable)
      .values({ nom: 'Harry Cot Test', collectiviteId: collectivite.id })
      .returning();
    const [t4] = await databaseService.db
      .insert(personneTagTable)
      .values({ nom: 'Zéli Tag Test', collectiviteId: collectivite.id })
      .returning();
    tag1Id = t1.id;
    _tag2Id = t2.id;
    tag3Id = t3.id;
    _tag4Id = t4.id;

    // Create 6 fiches
    const fiches = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        caller.plans.fiches.create({
          fiche: {
            collectiviteId: collectivite.id,
            titre: `Fiche personne-tag test ${i + 1}`,
          },
        })
      )
    );
    ficheIds = fiches.map((f) => f.id);

    // Setup pilotes: admin on fiche1, tag1 on fiche1+fiche2, tag3 on fiche3+fiche4
    await databaseService.db.insert(ficheActionPiloteTable).values([
      { ficheId: ficheIds[0], userId: adminUserId },
      { ficheId: ficheIds[0], tagId: tag1Id },
      { ficheId: ficheIds[1], tagId: tag1Id },
      { ficheId: ficheIds[2], tagId: tag3Id },
      { ficheId: ficheIds[3], tagId: tag3Id },
    ]);

    // Setup referents: tag3 on fiche1,fiche5,fiche6; tag1 on fiche4; admin on fiche2
    await databaseService.db.insert(ficheActionReferentTable).values([
      { ficheId: ficheIds[0], tagId: tag3Id },
      { ficheId: ficheIds[1], userId: adminUserId },
      { ficheId: ficheIds[3], tagId: tag1Id },
      { ficheId: ficheIds[4], tagId: tag3Id },
      { ficheId: ficheIds[5], tagId: tag3Id },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Appelle liste en tant que visiteur', async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(
      caller.collectivites.tags.personnes.list({
        collectiviteId: 99999,
      })
    ).resolves.toBeDefined();
  });

  test('Appelle list', async () => {
    const caller = router.createCaller({ user: adminUser });
    const invitationEmail = `personne-tag-list-${crypto.randomUUID()}@test.fr`;

    // Crée explicitement deux tags personnes pour la collectivité de test via le router
    const createdTag1 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Test Tag 1',
      collectiviteId: collectivite.id,
    });
    const createdTag2 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Test Tag 2',
      collectiviteId: collectivite.id,
    });
    const tagIds = [createdTag1.id, createdTag2.id];

    // Crée une invitation via le router, avec les tags associés
    const invitationId = await caller.collectivites.membres.invitations.create({
      collectiviteId: collectivite.id,
      email: invitationEmail,
      role: CollectiviteRole.EDITION,
      tagIds,
    });

    onTestFinished(async () => {
      if (invitationId) {
        await databaseService.db
          .delete(invitationTable)
          .where(eq(invitationTable.id, invitationId));
      }

      await Promise.all(
        tagIds.map((tagId) =>
          caller.collectivites.tags.delete({
            tagType: TagEnum.Personne,
            collectiviteId: collectivite.id,
            id: tagId,
          })
        )
      );
    });

    // Récupère les personne_tag créés pour la collectivité de test
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
      tagIds,
    });

    // Retourne les 2 personne_tags créés pour la collectivité de test
    expect(result.length).toBe(2);

    // Est-ce qu'il y a bien 2 tags ayant une invitation ?
    expect(result.filter((tag) => tag.email).length).toBe(2);

    // Récupère les deux tags créés
    const resultTwo = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
      tagIds,
    });
    // Retourne 2 tags ?
    expect(resultTwo.length).toBe(2);

    // Si on annule l'invitation, le tag ne doit plus avoir d'invitation associée
    await caller.collectivites.membres.invitations.deletePending({
      email: invitationEmail,
      collectiviteId: collectivite.id,
    });
    const resultAfter = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
      tagIds: [tagIds[0]],
    });
    // Le tag ne doit plus avoir d'invitation associée
    expect(resultAfter.length).toBe(1);
    expect(resultAfter[0].email).toBeNull();
  });

  test('Appelle toUser sans avoir les droits', async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(
      caller.collectivites.tags.personnes.convertToUser({
        collectiviteId: 99999,
        userId: adminUserId,
        tagIds: [tag1Id, tag3Id],
      })
    ).rejects.toThrowError();
  });

  test('convertToUser', async () => {
    const caller = router.createCaller({ user: adminUser });

    // Crée explicitement deux tags personnes pour la collectivité de test via le router
    const tag1 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Convert Tag 1',
      collectiviteId: collectivite.id,
    });
    const tag2 = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom: 'Convert Tag 2',
      collectiviteId: collectivite.id,
    });

    // Crée deux fiches actions pour la collectivité 1
    const [fiche1] = await databaseService.db
      .insert(ficheActionTable)
      .values({ collectiviteId: collectivite.id, titre: 'Fiche convert 1' })
      .returning();
    const [fiche2] = await databaseService.db
      .insert(ficheActionTable)
      .values({ collectiviteId: collectivite.id, titre: 'Fiche convert 2' })
      .returning();

    // Ajoute des pilotes et référents basés sur les tags créés
    await databaseService.db.insert(ficheActionPiloteTable).values([
      { ficheId: fiche1.id, tagId: tag1.id },
      { ficheId: fiche2.id, tagId: tag2.id },
    ]);
    await databaseService.db.insert(ficheActionReferentTable).values([
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
    const referentsBefore = await databaseService.db
      .select()
      .from(ficheActionReferentTable);
    const tagReferentsBefore = referentsBefore.filter(
      (r) => r.tagId === tag1.id || r.tagId === tag2.id
    ).length;
    expect(tagReferentsBefore).toBe(2);

    // Lance la transformation pour nos tags
    await caller.collectivites.tags.personnes.convertToUser({
      collectiviteId: collectivite.id,
      userId: adminUserId,
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
        p.userId === adminUserId &&
        (p.ficheId === fiche1.id || p.ficheId === fiche2.id)
    ).length;
    expect(userPilotesForUser).toBe(2);
    const referentsAfter = await databaseService.db
      .select()
      .from(ficheActionReferentTable);
    const tagReferentsAfter = referentsAfter.filter(
      (r) => r.tagId === tag1.id || r.tagId === tag2.id
    ).length;
    expect(tagReferentsAfter).toBe(0);
    const userReferentsForUser = referentsAfter.filter(
      (r) =>
        r.userId === adminUserId &&
        (r.ficheId === fiche1.id || r.ficheId === fiche2.id)
    ).length;
    expect(userReferentsForUser).toBe(2);
    const tagsAfter = await databaseService.db
      .select()
      .from(personneTagTable)
      .where(inArray(personneTagTable.id, [tag1.id, tag2.id]));
    expect(tagsAfter.length).toBe(0);

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
