import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { and, eq } from 'drizzle-orm';
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { LinkOidcIdentityToUserService } from './link-oidc-identity-to-user.service';

function buildClaims(overrides: Partial<OidcClaims> & { email: string }) {
  return {
    sub: 'sub-defaut',
    email_verified: true,
    given_name: 'Jeanne',
    usual_name: 'Dupont',
    siret: '21690123400011',
    idp_id: 'idp-agent-connect',
    ...overrides,
  } satisfies OidcClaims;
}

/**
 * L'évènement `auth:oidc:linked` se décide sur `xmax = 0` : seul Postgres sait
 * dire si l'upsert a inséré ou mis à jour. Un test à double mocké
 * n'affirmerait rien de ce qui compte ici — d'où l'e2e.
 */
describe("LinkOidcIdentityToUserService — évènement de liaison", () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let service: LinkOidcIdentityToUserService;
  let capture: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    service = app.get(LinkOidcIdentityToUserService);

    // Espion et non mock : on veut le vrai service (garde `isEnabled`) mais
    // aucun appel réseau vers PostHog depuis les tests.
    capture = vi
      .spyOn(app.get(TrackingService), 'capture')
      .mockImplementation(() => undefined);

    return async () => {
      await app.close();
    };
  });

  afterEach(() => {
    capture.mockClear();
  });

  const identite = (provider: 'proconnect' | 'moncompteademe', sub: string) =>
    databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, provider),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );

  test('première liaison → un évènement avec le provider et l’origine', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-liaison-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'proconnect',
      user.id,
      buildClaims({ sub, email: user.email }),
      'profil'
    );

    expect(capture).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith({
      distinctId: user.id,
      event: 'auth:oidc:linked',
      properties: { provider: 'proconnect', origine: 'profil' },
    });
  });

  test('rotation du sub → aucun évènement (le compte était déjà lié)', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const premierSub = `sub-rotation-1-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'proconnect',
      user.id,
      buildClaims({ sub: premierSub, email: user.email }),
      'connexion-automatique'
    );
    capture.mockClear();

    // Même compte, même provider, nouveau sub : l'upsert met à jour la ligne
    // existante (UNIQUE (user_id, provider)) au lieu d'en insérer une.
    const secondSub = `sub-rotation-2-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'proconnect',
      user.id,
      buildClaims({ sub: secondSub, email: user.email }),
      'connexion-automatique'
    );

    expect(capture).not.toHaveBeenCalled();

    const [ligne] = await identite('proconnect', secondSub);
    expect(ligne).toBeDefined();
    expect(await identite('proconnect', premierSub)).toHaveLength(0);
  });

  test('création de compte → aucun évènement (aucun compte préexistant rattaché)', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-creation-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'proconnect',
      user.id,
      buildClaims({ sub, email: user.email }),
      'creation-compte'
    );

    expect(capture).not.toHaveBeenCalled();
    expect(await identite('proconnect', sub)).toHaveLength(1);
  });

  test('un second provider sur le même compte est une nouvelle liaison', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const subProconnect = `sub-multi-pc-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'proconnect',
      user.id,
      buildClaims({ sub: subProconnect, email: user.email }),
      'connexion-automatique'
    );
    capture.mockClear();

    const subMca = `sub-multi-mca-${crypto.randomUUID()}`;
    await service.rattacherIdentite(
      'moncompteademe',
      user.id,
      buildClaims({ sub: subMca, email: user.email }),
      'profil'
    );

    expect(capture).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith({
      distinctId: user.id,
      event: 'auth:oidc:linked',
      properties: { provider: 'moncompteademe', origine: 'profil' },
    });
  });
});
