import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { LoginUserWithOidcProviderService } from './login-user-with-oidc-provider.service';

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

describe('LoginUserWithOidcProviderService — matching des comptes à la connexion OIDC (U4)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let service: LoginUserWithOidcProviderService;
  let supabaseService: SupabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    service = app.get(LoginUserWithOidcProviderService);
    supabaseService = app.get(SupabaseService);

    return async () => {
      await app.close();
    };
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  test('cas 1 — sub connu : maj last_sign_in_at/claims, retourne le compte lié', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-cas1-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: user.id,
      email: user.email,
      claims: { sub, email: user.email },
    });

    const avant = new Date();
    const claims = buildClaims({ sub, email: user.email });

    const result = await service.authentifier('proconnect', claims);

    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: user.email,
    });

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(new Date(identite.lastSignInAt).getTime()).toBeGreaterThanOrEqual(
      avant.getTime()
    );
    expect(identite.claims).toMatchObject({ sub, email: user.email });
  });

  test('cas 2 — email connu (aucun sub) : liaison automatique, droits intacts, nouvelleLiaison:true', async () => {
    const { user, collectivite, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(cleanup);

    const sub = `sub-cas2-${crypto.randomUUID()}`;
    // email en majuscules : la recherche doit être insensible à la casse.
    const claims = buildClaims({ sub, email: user.email.toUpperCase() });

    const result = await service.authentifier('proconnect', claims);

    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: user.email,
      nouvelleLiaison: true,
    });

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
    expect(identite.siret).toBe(claims.siret);
    expect(identite.idpId).toBe(claims.idp_id);

    // droits/données du compte intacts (fixture crée l'utilisateur avec
    // cette collectivité) : la liaison n'a rien déplacé.
    const [dcp] = await databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.id, user.id));
    expect(dcp.email).toBe(user.email);
    expect(collectivite.id).toBeDefined();
  });

  test('cas 2 — MonCompteAdeme avec email_verified false → email de confiance (ProConnect en coulisses) : liaison automatique', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(cleanup);

    // MonCompteAdeme est adossé à ProConnect : son email fait foi même quand le
    // Keycloak d'intégration renvoie `email_verified:false` — on lie quand même
    // (cf. isEmailVerified), au lieu de bloquer sur « email non vérifié ».
    const sub = `sub-mca-non-verifie-${crypto.randomUUID()}`;
    const claims = buildClaims({
      sub,
      email: user.email,
      email_verified: false,
    });

    const result = await service.authentifier('moncompteademe', claims);

    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: user.email,
      nouvelleLiaison: true,
    });

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'moncompteademe'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(identite).toBeDefined();
    expect(identite.userId).toBe(user.id);
  });

  test('cas 2 — email connu, claim email_verified ABSENT (ProConnect) → provider de confiance : liaison automatique', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(cleanup);

    // ProConnect n'émet pas `email_verified` : on le retire des claims. Son
    // email restant de confiance (cf. isEmailVerified), la liaison doit se
    // faire — contrairement à un `email_verified:false` explicite (bloquant).
    const sub = `sub-verifie-implicite-${crypto.randomUUID()}`;
    const claims = buildClaims({
      sub,
      email: user.email,
      email_verified: undefined,
    });

    const result = await service.authentifier('proconnect', claims);

    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: user.email,
      nouvelleLiaison: true,
    });

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

  test('cas 2 — sub déjà lié à ce compte pour un autre provider n’interfère pas', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-cas2-rotation-${crypto.randomUUID()}`;
    const premiereLiaison = await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: user.email })
    );
    expect(premiereLiaison).toMatchObject({
      statut: 'connexion',
      nouvelleLiaison: true,
    });

    // rotation du sub côté FI : la nouvelle identité prouvée
    // remplace l'ancienne sur (user_id, provider) — jamais deux lignes.
    const nouveauSub = `sub-cas2-rotation-2-${crypto.randomUUID()}`;
    const deuxiemeLiaison = await service.authentifier(
      'proconnect',
      buildClaims({ sub: nouveauSub, email: user.email })
    );
    expect(deuxiemeLiaison).toMatchObject({
      statut: 'connexion',
      userId: user.id,
    });

    const lignes = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.userId, user.id),
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect')
        )
      );
    expect(lignes).toHaveLength(1);
    expect(lignes[0].sub).toBe(nouveauSub);
  });

  test('email changé côté provider (cas 1) → synchronisation réussie de auth.users.email', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-sync-ok-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: user.id,
      email: user.email,
      claims: {},
    });

    const nouvelEmail = `nouveau-${user.email}`;
    // Simule ce que ferait réellement GoTrue derrière `updateUserById` (le
    // spy court-circuite l'appel réseau, mais le comportement observable —
    // `auth.users.email` mis à jour — doit rester vrai pour le test).
    const updateUserById = vi
      .spyOn(supabaseService.client.auth.admin, 'updateUserById')
      .mockImplementation(async (userId, attrs) => {
        await databaseService.db
          .update(authUsersTable)
          .set({ email: (attrs as { email: string }).email })
          .where(eq(authUsersTable.id, userId));
        return { data: { user: {} }, error: null } as never;
      });

    const result = await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: nouvelEmail })
    );

    expect(updateUserById).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ email: nouvelEmail, email_confirm: true })
    );
    // La sync ayant réussi, l'email de session renvoyé est le nouvel email.
    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: nouvelEmail,
    });

    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(identite.email).toBe(nouvelEmail);
  });

  test('email changé côté provider (cas 1) → collision loggée, aucun crash, identité garde son email propre', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-sync-collision-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: user.id,
      email: user.email,
      claims: {},
    });

    const emailDejaPris = `deja-pris-${user.email}`;
    vi.spyOn(
      supabaseService.client.auth.admin,
      'updateUserById'
    ).mockResolvedValue({
      data: { user: null },
      error: { message: 'A user with this email already exists' },
    } as never);

    const result = await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: emailDejaPris })
    );

    // aucune exception : la connexion réussit quand même, avec l'ancien
    // email (auth.users.email n'a pas pu être mis à jour).
    expect(result).toEqual({
      statut: 'connexion',
      userId: user.id,
      email: user.email,
    });

    // l'identité OIDC garde en revanche le dernier email vu côté provider.
    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(identite.email).toBe(emailDejaPris);
  });

  test('dcp.limited (cas 2) → statut compte-desactive, aucune liaison créée', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    await databaseService.db
      .update(dcpTable)
      .set({ limited: true })
      .where(eq(dcpTable.id, user.id));

    const sub = `sub-limited-${crypto.randomUUID()}`;
    const result = await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: user.email })
    );

    expect(result).toEqual({ statut: 'compte-desactive' });

    const lignes = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    expect(lignes).toHaveLength(0);
  });

  test('dcp.deleted (cas 2) → traité comme non trouvé (cas 3)', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    await databaseService.db
      .update(dcpTable)
      .set({ deleted: true })
      .where(eq(dcpTable.id, user.id));

    const sub = `sub-deleted-${crypto.randomUUID()}`;
    const result = await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: user.email })
    );

    expect(result).toEqual({ statut: 'non-reconnu' });
  });

  test('cas 3 — aucun compte correspondant', async () => {
    const result = await service.authentifier(
      'proconnect',
      buildClaims({
        sub: `sub-inconnu-${crypto.randomUUID()}`,
        email: `inconnu-${crypto.randomUUID()}@example.com`,
      })
    );

    expect(result).toEqual({ statut: 'non-reconnu' });
  });
});
