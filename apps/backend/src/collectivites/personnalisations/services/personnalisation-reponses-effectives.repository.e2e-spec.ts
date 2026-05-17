import { INestApplication } from '@nestjs/common';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import {
  addTestPersonnalisationData,
  addTestQuestionBanaticCompetencePourCollectivite,
  TestPersonnalisationData,
} from '@tet/backend/collectivites/personnalisations/personnalisations.test-fixture';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { onTestFinished } from 'vitest';
import { PersonnalisationReponsesEffectivesRepository } from './personnalisation-reponses-effectives.repository';

describe('PersonnalisationReponsesEffectivesRepository', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let reponsesEffectivesService: PersonnalisationReponsesEffectivesRepository;
  let personnalisationsService: PersonnalisationsService;
  let testData: TestPersonnalisationData;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    reponsesEffectivesService = app.get(
      PersonnalisationReponsesEffectivesRepository
    );
    personnalisationsService = app.get(PersonnalisationsService);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    testData = await addTestPersonnalisationData(databaseService);
    onTestFinished(testData.cleanup);
  });

  test("inclut une réponse binaire induite d'une compétence exercée lorsqu'il n'y a pas de réponse explicite", async () => {
    const { questionBinaireCompetenceBanaticId, cleanup } =
      await addTestQuestionBanaticCompetencePourCollectivite(databaseService, {
        collectiviteId: testData.collectivite.id,
        thematiqueId: testData.thematiqueId,
        collectiviteType: testData.collectivite.type,
      });
    onTestFinished(cleanup);

    const payload = await databaseService.db.transaction((tx) =>
      reponsesEffectivesService.getReponsesEffectivesPayload(
        testData.collectivite.id,
        tx
      )
    );

    expect(payload[questionBinaireCompetenceBanaticId]).toBe(true);
  });

  test('inclut une réponse choix valide et omet les questions sans réponse', async () => {
    await databaseService.db.insert(reponseChoixTable).values({
      collectiviteId: testData.collectivite.id,
      questionId: testData.questionChoixId,
      reponse: testData.choixId,
    });

    const payload = await personnalisationsService.getPersonnalisationReponses(
      testData.collectivite.id
    );

    expect(payload[testData.questionChoixId]).toBe(testData.choixId);
    expect(payload[testData.questionBinaireId]).toBeUndefined();
  });
});
