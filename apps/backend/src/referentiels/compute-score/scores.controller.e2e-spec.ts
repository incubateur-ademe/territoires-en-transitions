import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ImportActionDefinitionCoremeasureType } from '@tet/backend/referentiels/import-referentiel/import-action-definition.dto';
import {
  ReferentielIdEnum,
  ReferentielLabelEnum,
  ScoresPayload,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { default as request } from 'supertest';
import { getTestApp, getTestDatabase } from '../../../test/app-utils';
import { getAuthToken } from '../../../test/auth-utils';

describe('Referentiels scoring routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  test(`Bac à sable: récupération de multiple scores depuis les référentiels d'origine`, async () => {
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
        firstCollectiviteScore.scores.scoresTag[tag].pointReferentiel as number
      );

      expect(
        firstCollectiviteScore.scores.scoresTag[tag].pointPotentiel
      ).toBeLessThan(firstCollectiviteScore.scores.score.pointPotentiel);

      expect(
        firstCollectiviteScore.scores.scoresTag[tag].pointReferentiel
      ).toBeLessThan(firstCollectiviteScore.scores.score.pointReferentiel);
    });

    // Seuls ces tags donnent lieu à un calcul de score : ni les catégories,
    // ajoutées aux tags au chargement du référentiel, ni les autres tags
    // (thématiques, etc.) ne sont donc concernés
    expect(Object.keys(firstCollectiviteScore.scores.scoresTag).sort()).toEqual(
      [...expectedTags].sort()
    );
  });

  test('protège les scores courants, historiques et dérivés dans un lot mixte', async () => {
    const db = await getTestDatabase(app);
    const { collectivite: publicCollectivite } = await addTestCollectivite(db, {
      accesRestreint: false,
    });
    const { collectivite: privateCollectivite, user } =
      await addTestCollectiviteAndUser(db, {
        collectivite: { accesRestreint: true },
        user: { role: CollectiviteRole.LECTURE },
      });

    const scores = (ids: number[], options = '') =>
      request(app.getHttpServer()).get(
        `/referentiels/te/scores?collectiviteIds=${ids.join(',')}${options}`
      );
    const anon = `Bearer ${process.env.SUPABASE_ANON_KEY}`;
    const mixedIds = [publicCollectivite.id, privateCollectivite.id];
    const date = '&date=2026-01-01T00:00:00.000Z';

    await scores([publicCollectivite.id])
      .set('Authorization', anon)
      .expect(200);
    for (const options of ['', date, '&avecReferentielsOrigine=true']) {
      await scores(mixedIds, options).set('Authorization', anon).expect(403);
    }

    const memberToken = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });
    for (const options of ['', date, '&avecReferentielsOrigine=true']) {
      const response = await scores(mixedIds, options)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
      expect(
        response.body.collectiviteScores.map(
          (score: ScoresPayload) => score.collectiviteId
        )
      ).toEqual(mixedIds);
    }
  });

  afterAll(async () => {
    await app.close();
  });
});
