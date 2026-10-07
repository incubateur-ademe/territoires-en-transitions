import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCommunesMembres,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { CollectiviteCommunesMembresRepository } from '@tet/backend/collectivites/shared/collectivite-communes-membres.repository';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { onTestFinished } from 'vitest';

describe('CollectiviteCommunesMembresRepository', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectiviteCommunesMembresRepository;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = app.get(CollectiviteCommunesMembresRepository);

    return async () => {
      await app.close();
    };
  });

  const addGroupement = async () => {
    const { collectivite, cleanup } = await addTestCollectivite(db);
    onTestFinished(cleanup);
    return collectivite;
  };

  it('rend la population de la plus peuplée des communes membres', async () => {
    const epci = await addGroupement();
    const { cleanup } = await addTestCommunesMembres(db, {
      parentId: epci.id,
      populations: [12000, 46000, 3500],
    });
    onTestFinished(cleanup);

    expect(await repository.getPopulationMaxCommuneMembre(epci.id)).toBe(46000);
  });

  it('rend null pour une collectivité sans commune membre connue', async () => {
    const epci = await addGroupement();

    expect(await repository.getPopulationMaxCommuneMembre(epci.id)).toBeNull();
  });

  // Les membres d'un syndicat sont des EPCI, rattachés dans la même table :
  // leur population n'est pas celle d'une commune.
  it('ignore les membres qui ne sont pas des communes', async () => {
    const syndicat = await addGroupement();
    const { cleanup } = await addTestCommunesMembres(db, {
      parentId: syndicat.id,
      populations: [120000],
      type: collectiviteTypeEnum.EPCI,
    });
    onTestFinished(cleanup);

    expect(
      await repository.getPopulationMaxCommuneMembre(syndicat.id)
    ).toBeNull();
  });
});
