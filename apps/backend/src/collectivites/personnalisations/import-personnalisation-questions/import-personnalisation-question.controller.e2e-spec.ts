import { QuestionWithChoices } from '@/backend/collectivites/personnalisations/models/question-with-choices.dto';
import { questionTable } from '@/backend/collectivites/personnalisations/models/question.table';
import { getTestApp, getTestDatabase } from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';

describe('import-personnalisation-question.controller', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp({
      // simule l'env. de prod pour tester que l'on ne peut pas écraser la version courante
      mockProdEnv: true,
    });
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it(`Import des questions de personnalisation depuis le spreadsheet`, async () => {
    // Reset the version
    await databaseService.db.update(questionTable).set({ version: '0.0.1' });

    const importPath = `/personnalisation-questions/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);

    const question = (response.body.questions as QuestionWithChoices[])?.find(
      (question) => question.id === 'EP_1'
    );
    expect(question).toMatchObject({
      id: 'EP_1',
      thematiqueId: 'energie',
      ordonnancement: null,
      typesCollectivitesConcernees: null,
      type: 'choix',
      description: '',
      formulation:
        'La collectivité a-t-elle la compétence "éclairage public" ?',
      version: '1.0.0',
      choix: [
        {
          id: 'EP_1_a',
          ordonnancement: null,
          formulation: "Oui sur l'ensemble du territoire",
        },
        {
          id: 'EP_1_b',
          ordonnancement: null,
          formulation:
            "Oui partiellement (uniquement sur les zones d'intérêt communautaire par exemple)",
        },
        {
          id: 'EP_1_c',
          ordonnancement: null,
          formulation: 'Non pas du tout',
        },
      ],
    });

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 20000);
});
