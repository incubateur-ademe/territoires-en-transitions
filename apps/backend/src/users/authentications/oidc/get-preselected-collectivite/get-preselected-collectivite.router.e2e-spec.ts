import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';

describe('GetPreselectedCollectiviteRouter — pré-sélection par SIRET ProConnect (U5)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  async function creerContexte(siren: string | null) {
    const { user, collectivite, cleanup } = await addTestCollectiviteAndUser(
      databaseService
    );
    onTestFinished(cleanup);

    // Fixe le SIREN de la collectivité de test à une valeur connue (ou null).
    await databaseService.db
      .update(collectiviteTable)
      .set({ siren })
      .where(eq(collectiviteTable.id, collectivite.id));

    return {
      user,
      collectivite,
      authUser: getAuthUserFromUserCredentials(user),
    };
  }

  async function lierIdentiteAvecSiret(userId: string, siret: string | null) {
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub: `sub-${crypto.randomUUID()}`,
      userId,
      email: 'agent@collectivite.fr',
      siret,
    });
  }

  test('siret ProConnect correspondant à une collectivité unique → pré-sélection', async () => {
    const siren = '210900011';
    const { user, collectivite, authUser } = await creerContexte(siren);
    await lierIdentiteAvecSiret(user.id, `${siren}00019`);

    const caller = router.createCaller({ user: authUser });
    const preselection =
      await caller.users.authentications.oidc.getPreselectedCollectivite();

    expect(preselection).toMatchObject({
      collectiviteId: collectivite.id,
      siret: `${siren}00019`,
    });
  });

  test('aucune identité avec siret → pas de pré-sélection', async () => {
    const { user, authUser } = await creerContexte('210900011');
    await lierIdentiteAvecSiret(user.id, null);

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });

  test('siret sans collectivité correspondante → pas de pré-sélection', async () => {
    const { user, authUser } = await creerContexte('210900011');
    // SIREN du siret différent de celui de la collectivité.
    await lierIdentiteAvecSiret(user.id, '99999999900019');

    const caller = router.createCaller({ user: authUser });
    expect(
      await caller.users.authentications.oidc.getPreselectedCollectivite()
    ).toBeNull();
  });
});
