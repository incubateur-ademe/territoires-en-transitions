import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { UpdateUserRoleService } from '@tet/backend/users/authorizations/update-user-role/update-user-role.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { UserPreferencesRepository } from '@tet/backend/users/preferences/user-preferences.repository';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
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
import { AttachUserToOrganisationService } from '../attach-user-to-organisation/attach-user-to-organisation.service';
import { GetCollectiviteBySiretService } from '../get-collectivite-by-siret/get-collectivite-by-siret.service';
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
      TransactionModule,
      JwtModule.register({ global: true, secret: 'test-secret' }),
    ],
    providers: [
      LoginUserWithOidcProviderService,
      LinkOidcIdentityToUserService,
      CreateSupabaseSessionService,
      CreateUserOidcIdentityService,
      // Le rattachement automatique est monté pour de vrai : c'est à la
      // création de compte qu'il ouvre le service de l'agent.
      AttachUserToOrganisationService,
      GetCollectiviteBySiretService,
      UpdateUserRoleService,
      UserPreferencesRepository,
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
      // Le droit et la vérification que pose un rattachement automatique
      // référencent `auth.users` sans action en cascade : ils partent d'abord,
      // sinon la suppression du compte échoue.
      await databaseService.db
        .delete(utilisateurCollectiviteAccessTable)
        .where(eq(utilisateurCollectiviteAccessTable.userId, userId));
      await databaseService.db
        .delete(utilisateurVerifieTable)
        .where(eq(utilisateurVerifieTable.userId, userId));
      await databaseService.db.delete(dcpTable).where(eq(dcpTable.id, userId));
      await databaseService.db
        .delete(authUsersTable)
        .where(eq(authUsersTable.id, userId));
    });
  }

  /**
   * Un service de l'État de test, identifié par son SIRET. Le code de région
   * est tiré libre : une DREAL est unique par région, et les dix-huit codes
   * réels sont tous occupés par l'import (cf. `pickFreeRegionCode`).
   */
  async function addService(siren: string, nic: string) {
    const { collectivite, cleanup } = await addTestCollectivite(
      databaseService,
      {
        type: 'dreal',
        regionCode: await pickFreeRegionCode(databaseService, 'dreal'),
        siren,
        nic,
      }
    );
    onTestFinished(cleanup);
    // Le droit que le rattachement va poser retient la collectivité (clé
    // étrangère sans action en cascade). Le défaire ici, et non depuis le
    // nettoyage du compte, garde la base propre même si une assertion casse
    // avant : une DREAL laissée derrière soi rend le test infaisable au second
    // passage — elle est unique par région.
    onTestFinished(async () => {
      await databaseService.db
        .delete(utilisateurCollectiviteAccessTable)
        .where(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectivite.id)
        );
    });
    return collectivite;
  }

  async function lireDroit(userId: string, collectiviteId: number) {
    const [droit] = await databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      );
    return droit;
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

  describe("rattachement automatique à l'organisation du jeton", () => {
    test("un service de l'État reconnu → droit en édition, compte vérifié, service annoncé", async () => {
      mockCreateUser();
      vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
        success({ hashedToken: 'hashed-token-rattachement' })
      );
      const service_ = await addService('999777111', '00042');

      const email = `agent-${crypto.randomUUID()}@developpement-durable.gouv.fr`;
      const claims = buildClaims({ email, siret: '99977711100042' });

      const result = await service.creerCompte('proconnect', claims);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.rattachement).toEqual({
        collectiviteId: service_.id,
        nom: service_.nom,
        // Le type voyage jusqu'à l'app : c'est lui qui dit où atterrir.
        type: 'dreal',
      });

      const [identite] = await databaseService.db
        .select()
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.sub, claims.sub));
      cleanupUser(identite.userId);

      const droit = await lireDroit(identite.userId, service_.id);
      expect(droit).toMatchObject({
        role: 'edition',
        isActive: true,
        invitationId: null,
      });

      // Une identité prouvée vaut au moins une invitation par email : sans la
      // vérification, les gardes de collectivité traitent le compte à part.
      const [verifie] = await databaseService.db
        .select()
        .from(utilisateurVerifieTable)
        .where(eq(utilisateurVerifieTable.userId, identite.userId));
      expect(verifie?.verifie).toBe(true);

      // Le service à annoncer : c'est ce que l'app lit pour expliquer le
      // parcours une fois, et qu'elle remet à `null` en refermant.
      const [dcp] = await databaseService.db
        .select()
        .from(dcpTable)
        .where(eq(dcpTable.id, identite.userId));
      expect(dcp.preferences?.oidc.autoAttachedCollectiviteId).toBe(
        service_.id
      );
    });

    /**
     * Le second verrou, pour le jour où le fournisseur d'identité se
     * tromperait d'organisation : en août 2026, MonCompteAdeme renvoyait le
     * SIRET du siège de l'ADEME au lieu de celui du service choisi.
     */
    test("domaine de messagerie hors de celui exigé par l'employeur → aucun droit", async () => {
      mockCreateUser();
      vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
        success({ hashedToken: 'hashed-token-refuse' })
      );
      // Le SIREN de l'ADEME exige une adresse @ademe.fr.
      const service_ = await addService('385290309', '99042');

      const claims = buildClaims({
        email: `agent-${crypto.randomUUID()}@example.org`,
        siret: '38529030999042',
      });

      const result = await service.creerCompte('proconnect', claims);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.compteCree).toBe(true);
      expect(result.data.rattachement).toBeUndefined();

      const [identite] = await databaseService.db
        .select()
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.sub, claims.sub));
      cleanupUser(identite.userId);

      expect(await lireDroit(identite.userId, service_.id)).toBeUndefined();
    });

    test('le domaine exigé, respecté → rattachement', async () => {
      mockCreateUser();
      vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
        success({ hashedToken: 'hashed-token-ademe' })
      );
      const service_ = await addService('385290309', '99043');

      const claims = buildClaims({
        email: `agent-${crypto.randomUUID()}@ademe.fr`,
        siret: '38529030999043',
      });

      const result = await service.creerCompte('proconnect', claims);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.rattachement?.collectiviteId).toBe(service_.id);

      const [identite] = await databaseService.db
        .select()
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.sub, claims.sub));
      cleanupUser(identite.userId);
    });

    /** Rien ne dit qu'un agent public est employé de la commune qu'il désigne. */
    test("une commune reste sur le parcours d'invitation", async () => {
      mockCreateUser();
      vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
        success({ hashedToken: 'hashed-token-commune' })
      );
      const { collectivite: commune, cleanup } = await addTestCollectivite(
        databaseService,
        { type: 'commune', siren: '999777222', nic: '00042' }
      );
      onTestFinished(cleanup);

      const claims = buildClaims({
        email: `agent-${crypto.randomUUID()}@ville.fr`,
        siret: '99977722200042',
      });

      const result = await service.creerCompte('proconnect', claims);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.rattachement).toBeUndefined();

      const [identite] = await databaseService.db
        .select()
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.sub, claims.sub));
      cleanupUser(identite.userId);

      expect(await lireDroit(identite.userId, commune.id)).toBeUndefined();
    });

    test('un SIRET que rien ne désigne → aucun droit, le compte est créé', async () => {
      mockCreateUser();
      vi.spyOn(creerSessionService, 'creerSession').mockResolvedValue(
        success({ hashedToken: 'hashed-token-inconnu' })
      );

      const claims = buildClaims({
        email: `agent-${crypto.randomUUID()}@ailleurs.fr`,
        siret: '99966600000042',
      });

      const result = await service.creerCompte('proconnect', claims);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.compteCree).toBe(true);
      expect(result.data.rattachement).toBeUndefined();

      const [identite] = await databaseService.db
        .select()
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.sub, claims.sub));
      cleanupUser(identite.userId);
    });
  });
});
