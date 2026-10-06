import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { ConvertJwtToAuthUserService } from '@tet/backend/users/convert-jwt-to-auth-user.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';

describe('IndicateurSourcesRouter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns sources and rejects an API key without read permission', async () => {
    const database = await getTestDatabase(app);
    const owner = await addTestCollectiviteAndUser(database, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const router = app.get(TrpcRouter);
    const ownerUser = getAuthUserFromUserCredentials(owner.user);
    const token = signTestAuthToken(
      { ...ownerUser.jwtPayload, sub: ownerUser.id },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );
    const user = await app
      .get(ConvertJwtToAuthUserService)
      .convertJwtToAuthUser(token);
    const caller = router.createCaller({ user });
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId: owner.collectivite.id,
      titre: 'Indicateur sans source',
    });
    const input = { collectiviteId: owner.collectivite.id, indicateurId };

    await expect(caller.indicateurs.sources.available(input)).resolves.toEqual(
      []
    );
    const restrictedCaller = router.createCaller({
      user: {
        ...ownerUser,
        jwtPayload: { ...ownerUser.jwtPayload, permissions: [] },
      },
    });
    await expect(
      restrictedCaller.indicateurs.sources.available(input)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
