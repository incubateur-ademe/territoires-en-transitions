import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { success } from '@tet/backend/utils/result.type';
import { and, eq, sql } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { LoginUserWithOidcProviderService } from '../login-user-with-oidc-provider/login-user-with-oidc-provider.service';
import { CreateSupabaseSessionService } from '../create-supabase-session.service';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { LinkOidcIdentityToUserService } from '../link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { CreateUserOidcIdentityService } from './create-user-oidc-identity.service';

function buildClaims(overrides: Partial<OidcClaims> & { email: string }) {
  return {
    sub: `sub-${crypto.randomUUID()}`,
    email_verified: true,
    given_name: 'Jeanne',
    usual_name: 'Dupont',
    ...overrides,
  } satisfies OidcClaims;
}

/**
 * Module de test minimal (plutôt que `getTestApp()`/`AppModule` complet) :
 * n'engage que les dépendances réellement exercées par
 * `CreateUserOidcIdentityService` (vraie DB, vrai matching `LoginUserWithOidcProviderService`
 * + `LinkOidcIdentityToUserService`), sans dépendre du câblage complet de
 * `UsersModule` (autres features OIDC en cours de développement en parallèle
 * sur cette branche).
 */
async function createTestingContext() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigurationModule,
      DatabaseModule,
      JwtModule.register({ global: true, secret: 'test-secret' }),
    ],
    providers: [
      LoginUserWithOidcProviderService,
      LinkOidcIdentityToUserService,
      CreateSupabaseSessionService,
      CreateUserOidcIdentityService,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('CreateUserOidcIdentityService — création de compte (cas 3-Non, U5)', () => {
  let app: Awaited<ReturnType<typeof createTestingContext>>;
  let databaseService: DatabaseService;
  let supabaseService: SupabaseService;
  let service: CreateUserOidcIdentityService;
  let creerSessionService: CreateSupabaseSessionService;

  beforeAll(async () => {
    app = await createTestingContext();
    databaseService = app.get(DatabaseService);
    supabaseService = app.get(SupabaseService);
    service = app.get(CreateUserOidcIdentityService);
    creerSessionService = app.get(CreateSupabaseSessionService);
    // s'assure que ConfigurationService a bien pu se construire (Zod parse)
    app.get(ConfigurationService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Simule ce que ferait réellement GoTrue derrière `auth.admin.createUser`
   * (insert dans `auth.users`, ce qui déclenche `sync_dcp`) sans dépendre
   * d'un réseau Supabase local — même approche que le spy sur
   * `updateUserById` dans `authentifier-oidc.service.e2e-spec.ts`.
   */
  function mockCreateUser() {
    return vi
      .spyOn(supabaseService.client.auth.admin, 'createUser')
      .mockImplementation(async (attrs) => {
        const userId = crypto.randomUUID();
        const { email, user_metadata } = attrs as {
          email: string;
          user_metadata?: { nom?: string; prenom?: string };
        };
        await databaseService.db.insert(authUsersTable).values({
          instanceId: '00000000-0000-0000-0000-000000000000',
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email,
          encryptedPassword:
            '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C',
          emailConfirmedAt: sql`now()`,
          confirmationToken: '',
          recoveryToken: '',
          emailChangeTokenNew: '',
          emailChange: '',
          rawAppMetaData: { provider: 'proconnect', providers: ['proconnect'] },
          rawUserMetaData: user_metadata,
          createdAt: sql`now()`,
          updatedAt: sql`now()`,
        });
        return {
          data: { user: { id: userId } },
          error: null,
        } as never;
      });
  }

  function cleanupUser(userId: string) {
    onTestFinished(async () => {
      await databaseService.db
        .delete(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.userId, userId));
      await databaseService.db.delete(dcpTable).where(eq(dcpTable.id, userId));
      await databaseService.db
        .delete(authUsersTable)
        .where(eq(authUsersTable.id, userId));
    });
  }

  test('ticket valide, aucun compte existant → compte créé, dcp existe, identité liée, session pontée', async () => {
    const createUser = mockCreateUser();
    vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
      success({ hashedToken: 'hashed-token-creation' })
    );

    const email = `nouvel-agent-${crypto.randomUUID()}@collectivite.fr`;
    const claims = buildClaims({
      email,
      given_name: 'Jeanne',
      usual_name: 'Dupont',
    });

    const result = await service.creerCompte('proconnect', claims);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.compteCree).toBe(true);
    expect(result.data.hashedToken).toBe('hashed-token-creation');

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email,
        email_confirm: true,
        user_metadata: { nom: 'Dupont', prenom: 'Jeanne' },
      })
    );

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, claims.sub)
        )
      );
    expect(identite).toBeDefined();
    cleanupUser(identite.userId);

    const [dcp] = await databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.id, identite.userId));
    expect(dcp).toBeDefined();
    expect(dcp.nom).toBe('Dupont');
    expect(dcp.prenom).toBe('Jeanne');
    expect(dcp.email).toBe(email);

    expect(creerSessionService.creerSession).toHaveBeenCalledWith(email);
  });

  test('échec de auth.admin.createUser → CREATION_COMPTE_ERROR, aucune identité créée', async () => {
    vi.spyOn(supabaseService.client.auth.admin, 'createUser').mockResolvedValue(
      {
        data: { user: null },
        error: { message: 'Email already registered' },
      } as never
    );

    const claims = buildClaims({
      email: `echec-${crypto.randomUUID()}@collectivite.fr`,
    });

    const result = await service.creerCompte('proconnect', claims);

    expect(result).toMatchObject({
      success: false,
      error: 'CREATION_COMPTE_ERROR',
    });

    const lignes = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, claims.sub)
        )
      );
    expect(lignes).toHaveLength(0);
  });

  test('échec du pont de session après création → SESSION_ERROR (le compte reste créé)', async () => {
    const createUser = mockCreateUser();
    vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue({
      success: false,
      error: 'GENERATE_LINK_ERROR',
    });

    const email = `session-echec-${crypto.randomUUID()}@collectivite.fr`;
    const claims = buildClaims({ email });

    const result = await service.creerCompte('proconnect', claims);

    expect(result).toMatchObject({ success: false, error: 'SESSION_ERROR' });
    expect(createUser).toHaveBeenCalled();

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, claims.sub)
        )
      );
    expect(identite).toBeDefined();
    cleanupUser(identite.userId);
  });

  test('ticket valide mais un compte existe déjà entre-temps (double-clic, sub connu) → pas de doublon, reconnexion normale', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-doubleclic-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: user.id,
      email: user.email,
      claims: { sub, email: user.email },
    });

    const createUser = mockCreateUser();
    vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
      success({ hashedToken: 'hashed-token-reconnexion' })
    );

    const claims = buildClaims({ sub, email: user.email });

    const result = await service.creerCompte('proconnect', claims);

    expect(result).toEqual({
      success: true,
      data: { compteCree: false, hashedToken: 'hashed-token-reconnexion' },
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(creerSessionService.creerSession).toHaveBeenCalledWith(user.email);

    const lignes = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.userId, user.id)
        )
      );
    expect(lignes).toHaveLength(1);
  });

  test('ticket valide mais un compte existe déjà entre-temps (double-clic, email vérifié connu) → pas de doublon, liaison automatique', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const createUser = mockCreateUser();
    vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
      success({ hashedToken: 'hashed-token-liaison' })
    );

    const sub = `sub-doubleclic-email-${crypto.randomUUID()}`;
    const claims = buildClaims({ sub, email: user.email });

    const result = await service.creerCompte('proconnect', claims);

    expect(result).toEqual({
      success: true,
      data: { compteCree: false, hashedToken: 'hashed-token-liaison' },
    });
    expect(createUser).not.toHaveBeenCalled();

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(identite).toBeDefined();
    expect(identite.userId).toBe(user.id);
  });
});
