import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { success, type Result } from '@tet/backend/utils/result.type';
import { beforeAll, describe, expect, it } from 'vitest';
import { CollectiviteVoletGesRepository } from './collectivite-volet-ges.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { type VoletError } from './volet.errors';

describe('MobilisationRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectiviteVoletGesRepository;
  let collectiviteId: number;
  let otherCollectiviteId: number;
  let collectiviteWithoutMobilisationId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = app.get(CollectiviteVoletGesRepository);

    const collectivite = await addTestCollectivite(db);
    const otherCollectivite = await addTestCollectivite(db);
    const collectiviteWithoutMobilisation = await addTestCollectivite(db);
    collectiviteId = collectivite.collectivite.id;
    otherCollectiviteId = otherCollectivite.collectivite.id;
    collectiviteWithoutMobilisationId =
      collectiviteWithoutMobilisation.collectivite.id;

    await db.db.insert(collectiviteVoletGesTable).values([
      {
        collectiviteId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
        note: 3,
        ficheIds: [12, 5],
        createdAt: '2026-09-20T02:00:05.000Z',
      },
      {
        collectiviteId,
        levierId: 'velo_transport_commun',
        categorie: 'planification',
        note: 0,
        ficheIds: [],
        createdAt: '2026-09-20T02:00:00.000Z',
      },
      {
        collectiviteId,
        levierId: 'covoiturage',
        categorie: 'sensibilisation',
        note: 2,
        ficheIds: [5, 8],
        createdAt: '2026-09-20T02:00:09.000Z',
      },
      {
        collectiviteId: otherCollectiviteId,
        levierId: 'biogaz',
        categorie: 'financement',
        note: 1,
        ficheIds: [40],
        createdAt: '2026-09-21T02:00:00.000Z',
      },
    ]);

    return async () => {
      await collectivite.cleanup();
      await otherCollectivite.cleanup();
      await collectiviteWithoutMobilisation.cleanup();
      await app.close();
    };
  });

  const listTestCollectivitesWithMobilisation = async (): Promise<
    Result<number[], VoletError>
  > => {
    const collectiviteIdsResult =
      await repository.listCollectivitesWithMobilisation();
    if (!collectiviteIdsResult.success) {
      return collectiviteIdsResult;
    }
    const testCollectiviteIds = [
      collectiviteId,
      otherCollectiviteId,
      collectiviteWithoutMobilisationId,
    ];
    return success(
      collectiviteIdsResult.data.filter((id) =>
        testCollectiviteIds.includes(id)
      )
    );
  };

  it('listCollectivitesWithMobilisation renvoie toutes les CT qui ont un engagement', async () => {
    expect(await listTestCollectivitesWithMobilisation()).toEqual({
      success: true,
      data: [collectiviteId, otherCollectiviteId],
    });
  });

  it('listCollectivitesWithMobilisation ne renvoie pas une CT sans engagement', async () => {
    const collectiviteIdsResult =
      await repository.listCollectivitesWithMobilisation();

    expect({
      success: collectiviteIdsResult.success,
      hasCollectiviteWithoutMobilisation:
        collectiviteIdsResult.success &&
        collectiviteIdsResult.data.includes(collectiviteWithoutMobilisationId),
    }).toEqual({ success: true, hasCollectiviteWithoutMobilisation: false });
  });

  it("getMobilisationState renvoie la date de calcul de l'engagement de la CT et toutes les fiches qu'il cite", async () => {
    expect(await repository.getMobilisationState({ collectiviteId })).toEqual({
      success: true,
      data: {
        kind: 'calculated',
        calculatedAt: new Date('2026-09-20T02:00:00.000Z'),
        ficheIds: [5, 8, 12],
      },
    });
  });

  it('getMobilisationState renvoie never_calculated pour une CT sans engagement', async () => {
    expect(
      await repository.getMobilisationState({
        collectiviteId: collectiviteWithoutMobilisationId,
      })
    ).toEqual({
      success: true,
      data: { kind: 'never_calculated' },
    });
  });
});
