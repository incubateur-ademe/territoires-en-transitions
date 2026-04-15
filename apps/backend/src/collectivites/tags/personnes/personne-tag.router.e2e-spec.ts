import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import { invitationTable } from '../../membres/invitation.table';
import { invitationPersonneTagTable } from '../../membres/mutate-invitations/invitation-personne-tag.table';

describe('Test PersonneTagService', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let adminUser: AuthenticatedUser;
  let adminUserId: string;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let collectiviteCleanup: () => Promise<void>;

  // Tags
  let tag1Id: number;
  // tag2Id et tag4Id sont créés pour avoir 4 tags dans la collectivité
  let _tag2Id: number;
  let tag3Id: number;
  let tag4Id: number;

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
    collectiviteCleanup = testResult.cleanup;
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
    tag4Id = t4.id;

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
    await collectiviteCleanup?.();
    await app.close();
  });

  test('Appelle liste en tant que visiteur', async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(() =>
      caller.collectivites.tags.personnes.list({
        collectiviteId: 99999,
      })
    ).not.toThrow();
  });

  test('Appelle list', async () => {
    const caller = router.createCaller({ user: adminUser });

    // Créé une invitation
    const [invitationAdded] = await databaseService.db
      .insert(invitationTable)
      .values({
        role: CollectiviteRole.EDITION,
        email: 'tag-list-test@test.fr',
        collectiviteId: collectivite.id,
        createdBy: adminUserId,
      })
      .returning();

    // Ajoute des tags à l'invitation (tag1 et tag3)
    await databaseService.db.insert(invitationPersonneTagTable).values([
      {
        tagId: tag1Id,
        invitationId: invitationAdded.id,
        tagNom: 'Lou Piote Test',
      },
      {
        tagId: tag3Id,
        invitationId: invitationAdded.id,
        tagNom: 'Harry Cot Test',
      },
    ]);

    // Récupère les personne_tag de la collectivité
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
    });

    // Retourne tous les personne_tags de la collectivité (4 tags)
    expect(result.length).toBe(4);
    // Est-ce qu'il y a bien 2 tags ayant une invitation ?
    expect(result.filter((tag) => tag.email).length).toBe(2);

    // Récupère 2 tags spécifiques
    const resultTwo = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
      tagIds: [tag1Id, tag4Id],
    });
    // Retourne 2 tags ?
    expect(resultTwo.length).toBe(2);

    // Si on annule l'invitation, le tag ne doit plus avoir d'invitation associée
    await caller.collectivites.membres.invitations.deletePending({
      email: 'tag-list-test@test.fr',
      collectiviteId: collectivite.id,
    });
    const resultAfter = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
      tagIds: [tag1Id],
    });
    // Le tag ne doit plus avoir d'invitation associée
    expect(resultAfter.length).toBe(1);
    expect(resultAfter[0].email).toBeNull();
  });

  test('Appelle toUser sans avoir les droits', async () => {
    const caller = router.createCaller({ user: adminUser });
    await expect(() =>
      caller.collectivites.tags.personnes.convertToUser({
        collectiviteId: 99999,
        userId: adminUserId,
        tagIds: [tag1Id, tag3Id],
      })
    ).rejects.toThrowError();
  });

  test('convertToUser', async () => {
    const caller = router.createCaller({ user: adminUser });

    // Vérifie avant la transformation (scoped to our fiches)
    const pilotes = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));

    // Il y a bien 1 pilote utilisateur ?
    expect(pilotes.filter((p) => p.userId).length).toBe(1);
    // Il y a bien 4 pilotes tags ?
    expect(pilotes.filter((p) => p.tagId).length).toBe(4);

    // Lance la transformation
    await caller.collectivites.tags.personnes.convertToUser({
      collectiviteId: collectivite.id,
      userId: adminUserId,
      tagIds: [tag1Id, tag3Id],
    });

    // Vérifie après la transformation
    const result = await caller.collectivites.tags.personnes.list({
      collectiviteId: collectivite.id,
    });
    // Il y a bien 2 tags personnes ? (anciennement 4, tags 1 et 3 convertis)
    expect(result.length).toBe(2);

    const pilotesAfter = await databaseService.db
      .select()
      .from(ficheActionPiloteTable)
      .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));

    // Il y a bien 4 pilotes utilisateurs ? (admin on fiche1 + fiche2 + fiche3 + fiche4)
    expect(pilotesAfter.filter((p) => p.userId).length).toBe(4);
    // Il n'y a plus de pilote tag ?
    expect(pilotesAfter.filter((p) => p.tagId).length).toBe(0);
  });
});
