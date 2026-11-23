import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { describe, expect, test } from 'vitest';

describe('Filtre des indicateurs sans ancêtre confidentiel', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let memberUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    memberUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createGroupe = async ({
    parentEstConfidentiel,
  }: {
    parentEstConfidentiel: boolean;
  }) => {
    const member = router.createCaller({ user: memberUser });
    const parentId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Déchets ménagers',
      unite: 't',
    });
    const enfantId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Ordures ménagères',
      parentId,
    });
    const petitEnfantId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Ordures ménagères des communes',
      parentId: enfantId,
    });
    if (parentEstConfidentiel) {
      await member.indicateurs.indicateurs.update({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
        indicateurFields: { estConfidentiel: true },
      });
    }
    return { member, parentId, enfantId, petitEnfantId };
  };

  const listIds = async ({
    member,
    indicateurIds,
    sansAncetreConfidentiel,
  }: {
    member: ReturnType<TrpcRouter['createCaller']>;
    indicateurIds: number[];
    sansAncetreConfidentiel?: boolean;
  }) => {
    const { data } = await member.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: { indicateurIds, sansAncetreConfidentiel },
      queryOptions: { page: 1, limit: 50 },
    });
    return data.map(({ id }) => id).sort((a, b) => a - b);
  };

  test("exclut les descendants d'un parent confidentiel, sur tous les niveaux, et garde le parent", async () => {
    const { member, parentId, enfantId, petitEnfantId } = await createGroupe({
      parentEstConfidentiel: true,
    });

    await expect(
      listIds({
        member,
        indicateurIds: [parentId, enfantId, petitEnfantId],
        sansAncetreConfidentiel: true,
      })
    ).resolves.toEqual([parentId]);
  });

  test("garde tous les indicateurs quand aucun ancêtre n'est confidentiel", async () => {
    const { member, parentId, enfantId, petitEnfantId } = await createGroupe({
      parentEstConfidentiel: false,
    });

    await expect(
      listIds({
        member,
        indicateurIds: [parentId, enfantId, petitEnfantId],
        sansAncetreConfidentiel: true,
      })
    ).resolves.toEqual([parentId, enfantId, petitEnfantId]);
  });

  test('ne filtre rien sans le filtre, même pour les descendants d’un parent confidentiel', async () => {
    const { member, parentId, enfantId, petitEnfantId } = await createGroupe({
      parentEstConfidentiel: true,
    });

    await expect(
      listIds({
        member,
        indicateurIds: [parentId, enfantId, petitEnfantId],
      })
    ).resolves.toEqual([parentId, enfantId, petitEnfantId]);
  });
});
