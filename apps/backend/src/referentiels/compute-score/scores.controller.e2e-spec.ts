import { ImportActionDefinitionCoremeasureType } from '@/backend/referentiels/import-referentiel/import-referentiel.service';
import { ReferentielIdEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import { ReferentielLabelEnum } from '@/backend/referentiels/models/referentiel-label.enum';
import { ScoresPayload } from '@/backend/referentiels/snapshots/scores-payload.dto';
import { INestApplication } from '@nestjs/common';
import { default as request } from 'supertest';
import { getTestApp } from '../../../test/app-utils';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test(`Bac à sable: récupération de multiple scores depuis les référentiels d'origine`, async () => {
    // Importe le referentiel TE
    await request(app.getHttpServer())
      .get(`/referentiels/te/import`)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(
        `/referentiels/te/scores?collectiviteIds=1&avecReferentielsOrigine=true`
      )
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const responseBody = response.body as {
      referentielVersion: string;
      collectiviteScores: ScoresPayload[];
    };
    const firstCollectiviteScore = responseBody.collectiviteScores[0];

    // Te referentiel is evolving, so we can't test the exact score but a least the structure
    expect(firstCollectiviteScore.scores.score).toMatchObject({
      actionId: 'te',
      completedTachesCount: expect.any(Number),
      concerne: true,
      desactive: false,
      etoiles: expect.any(Number),
      faitTachesAvancement: expect.any(Number),
      pasConcerneTachesAvancement: expect.any(Number),
      pasFaitTachesAvancement: expect.any(Number),
      pointFait: expect.any(Number),
      pointNonRenseigne: expect.any(Number),
      pointPasFait: expect.any(Number),
      pointPotentiel: expect.any(Number),
      pointPotentielPerso: null,
      pointProgramme: expect.any(Number),
      pointReferentiel: expect.any(Number),
      programmeTachesAvancement: expect.any(Number),
      totalTachesCount: expect.any(Number),
    });

    expect(firstCollectiviteScore.scores.score.pointPotentiel).toBeLessThan(
      firstCollectiviteScore.scores.score.pointReferentiel
    );

    const expectedTags = [
      ReferentielIdEnum.CAE,
      ReferentielIdEnum.ECI,
      ReferentielLabelEnum.TE_CAE,
      ReferentielLabelEnum.TE_ECI,
      ImportActionDefinitionCoremeasureType.COREMEASURE,
    ];

    expectedTags.forEach((tag) => {
      expect(firstCollectiviteScore.scores.scoresTag[tag]).toEqual({
        pointFait: expect.any(Number),
        pointProgramme: expect.any(Number),
        pointPasFait: expect.any(Number),
        pointNonRenseigne: expect.any(Number),
        pointPotentiel: expect.any(Number),
        pointReferentiel: expect.any(Number),
      });
      expect(
        firstCollectiviteScore.scores.scoresTag[tag].pointPotentiel
      ).toBeLessThanOrEqual(
        firstCollectiviteScore.scores.scoresTag[tag].pointReferentiel!
      );

      expect(
        firstCollectiviteScore.scores.scoresTag[tag].pointPotentiel
      ).toBeLessThan(firstCollectiviteScore.scores.score.pointPotentiel);

      expect(
        firstCollectiviteScore.scores.scoresTag[tag].pointReferentiel
      ).toBeLessThan(firstCollectiviteScore.scores.score.pointReferentiel);
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
