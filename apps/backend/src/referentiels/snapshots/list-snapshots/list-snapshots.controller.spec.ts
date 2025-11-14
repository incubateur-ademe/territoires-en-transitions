import { ReferentielsRouter } from '@/backend/referentiels/referentiels.router';
import { LIST_DEFAULT_JALONS } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { ListSnapshotsApiResponse } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-response';
import {
  getAuthUser,
  getTestApp,
  ISO_8601_DATE_TIME_REGEX,
  signInWith,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@/domain/referentiels';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Api pour lister les snapshots', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let router: ReferentielsRouter;
  let yoloDodoUser: AuthenticatedUser;
  const collectiviteId = 1;
  const referentielId = ReferentielIdEnum.CAE;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(ReferentielsRouter);
    yoloDodoUser = await getAuthUser();
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test('Invalid referentiel', async () => {
    await request(app.getHttpServer())
      .get(`/collectivites/${collectiviteId}/referentiels/toto/score-snapshots`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          errors: [
            expect.objectContaining({
              code: 'invalid_value',
              path: ['referentielId'],
            }),
          ],
          statusCode: 400,
        });
      });
  });

  test('Invalid collectivitId', async () => {
    await request(app.getHttpServer())
      .get(`/collectivites/toto/referentiels/${referentielId}/score-snapshots`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          errors: [
            expect.objectContaining({
              code: 'invalid_type',
              path: ['collectiviteId'],
            }),
          ],
          statusCode: 400,
        });
      });
  });

  test('Liste des snapshots ok', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // Force à avoir le snapshot courant
    await caller.snapshots.getCurrent({
      referentielId: referentielId,
      collectiviteId,
    });

    const response = await request(app.getHttpServer())
      .get(
        `/collectivites/${collectiviteId}/referentiels/${referentielId}/score-snapshots`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      collectiviteId: 1,
      referentielId: referentielId,
      jalons: LIST_DEFAULT_JALONS,
      snapshots: expect.any(Array),
    });

    const foundSnapshot = (
      response.body as ListSnapshotsApiResponse
    ).snapshots.find(
      (snapshot) => snapshot.jalon === SnapshotJalonEnum.COURANT
    );
    expect(foundSnapshot).toMatchObject({
      ref: 'score-courant',
      nom: 'Score courant',
      date: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      jalon: SnapshotJalonEnum.COURANT,
      pointFait: expect.any(Number),
      pointProgramme: expect.any(Number),
      pointPasFait: expect.any(Number),
      pointPotentiel: expect.any(Number),
      referentielVersion: expect.any(String),
      auditId: null,
      createdAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      modifiedAt: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
      pointNonRenseigne: expect.any(Number),
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
