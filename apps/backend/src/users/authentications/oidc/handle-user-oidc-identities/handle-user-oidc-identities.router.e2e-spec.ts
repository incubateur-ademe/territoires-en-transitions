import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { OidcClientService } from '../oidc-client.service';
import {
  utilisateurIdentiteOidcTable,
  oidcProviders,
} from '../models/utilisateur-identite-oidc.table';

describe('HandleUserOidcIdentitiesRouter — liaison volontaire et déliaison depuis le profil (U8)', () => {
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

  async function creerUtilisateur() {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);
    return { user, authUser: getAuthUserFromUserCredentials(user) };
  }

  async function lierIdentite(
    userId: string,
    provider: 'proconnect' | 'moncompteademe',
    sub: string
  ) {
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider,
      sub,
      userId,
      email: 'test@example.com',
    });
  }

  async function retirerMotDePasse(userId: string) {
    await databaseService.db
      .update(authUsersTable)
      .set({ encryptedPassword: '' })
      .where(eq(authUsersTable.id, userId));
  }

  test('listUserIdentities retourne les identités du compte courant', async () => {
    const { user, authUser } = await creerUtilisateur();
    await lierIdentite(user.id, 'proconnect', `sub-${crypto.randomUUID()}`);

    const caller = router.createCaller({ user: authUser });
    const identites =
      await caller.users.authentications.oidc.listUserIdentities();

    expect(identites).toHaveLength(1);
    expect(identites[0]).toMatchObject({ provider: 'proconnect' });
  });

  test('unlinkIdentityFromUser supprime la ligne quand un mot de passe est utilisable', async () => {
    const { user, authUser } = await creerUtilisateur();
    const sub = `sub-${crypto.randomUUID()}`;
    await lierIdentite(user.id, 'proconnect', sub);

    const caller = router.createCaller({ user: authUser });
    await caller.users.authentications.oidc.unlinkIdentityFromUser({
      provider: 'proconnect',
    });

    const identites =
      await caller.users.authentications.oidc.listUserIdentities();
    expect(identites).toHaveLength(0);
  });

  test('unlinkIdentityFromUser refuse quand c’est le dernier moyen de connexion (pas de mot de passe, pas d’autre identité)', async () => {
    const { user, authUser } = await creerUtilisateur();
    const sub = `sub-${crypto.randomUUID()}`;
    await lierIdentite(user.id, 'proconnect', sub);
    await retirerMotDePasse(user.id);

    const caller = router.createCaller({ user: authUser });

    await expect(
      caller.users.authentications.oidc.unlinkIdentityFromUser({
        provider: 'proconnect',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const identites =
      await caller.users.authentications.oidc.listUserIdentities();
    expect(identites).toHaveLength(1);
  });

  test('unlinkIdentityFromUser autorisée sans mot de passe si une autre identité reste liée', async () => {
    const { user, authUser } = await creerUtilisateur();
    await lierIdentite(user.id, 'proconnect', `sub-${crypto.randomUUID()}`);
    await lierIdentite(
      user.id,
      'moncompteademe',
      `sub-mca-${crypto.randomUUID()}`
    );
    await retirerMotDePasse(user.id);

    const caller = router.createCaller({ user: authUser });
    await caller.users.authentications.oidc.unlinkIdentityFromUser({
      provider: 'proconnect',
    });

    const identites =
      await caller.users.authentications.oidc.listUserIdentities();
    expect(identites).toEqual([
      expect.objectContaining({ provider: 'moncompteademe' }),
    ]);
  });

  test('listActiveProviders — reflète exactement les providers activés (indépendant des flags d’env)', async () => {
    const caller = router.createCaller({ user: null });
    const providers =
      await caller.users.authentications.oidc.listActiveProviders();

    // On ne code pas en dur quels providers sont activés (dépend des flags
    // *_ENABLED de l'environnement, qui varient) : on vérifie que le endpoint
    // expose EXACTEMENT ce que le client OIDC considère comme activé, et que
    // chaque valeur est un provider connu.
    expect(providers).toEqual(app.get(OidcClientService).getEnabledProviders());
    for (const provider of providers) {
      expect(oidcProviders).toContain(provider);
    }
  });
});
