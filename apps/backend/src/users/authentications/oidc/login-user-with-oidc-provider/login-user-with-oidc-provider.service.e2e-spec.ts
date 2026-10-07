import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
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
  let trackingService: TrackingService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    service = app.get(LoginUserWithOidcProviderService);
    supabaseService = app.get(SupabaseService);
    trackingService = app.get(TrackingService);

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

  /**
   * L'agent peut changer d'organisation d'un jour à l'autre. Figer le siret à la
   * première connexion laissait la pré-sélection désigner un service quitté.
   */
  test('cas 1 — le siret stocké suit la dernière connexion', async () => {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);

    const sub = `sub-siret-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: user.id,
      email: user.email,
      siret: '11111111100011',
    });

    await service.authentifier(
      'proconnect',
      buildClaims({ sub, email: user.email, siret: '22222222200022' })
    );

    const [identite] = await databaseService.db
      .select({ siret: utilisateurIdentiteOidcTable.siret })
      .from(utilisateurIdentiteOidcTable)
      .where(eq(utilisateurIdentiteOidcTable.sub, sub));
    expect(identite.siret).toBe('22222222200022');
  });

  describe('évènement auth:oidc:linked', () => {
    /**
     * L'évènement était émis par l'app au retour de la redirection, où il
     * était perdu (capture avant l'init de posthog-js). Il est désormais émis
     * ici, au moment de l'écriture — donc testable.
     */
    const espionnerCapture = () => {
      const capture = vi
        .spyOn(trackingService, 'capture')
        .mockImplementation(() => undefined);
      onTestFinished(() => capture.mockRestore());
      return capture;
    };

    test('cas 2 — une nouvelle liaison émet l’évènement une fois', async () => {
      const { user, cleanup } = await addTestCollectiviteAndUser(
        databaseService
      );
      onTestFinished(cleanup);
      const capture = espionnerCapture();

      const sub = `sub-linked-${crypto.randomUUID()}`;
      await service.authentifier(
        'proconnect',
        buildClaims({ sub, email: user.email })
      );

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith({
        distinctId: user.id,
        event: 'auth:oidc:linked',
        properties: { provider: 'proconnect', origine: 'connexion-automatique' },
      });
    });

    test('cas 2 — rotation du sub (compte déjà lié) n’émet rien', async () => {
      const { user, cleanup } = await addTestCollectiviteAndUser(
        databaseService
      );
      onTestFinished(cleanup);

      const ancienSub = `sub-rotation-avant-${crypto.randomUUID()}`;
      await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
        provider: 'proconnect',
        sub: ancienSub,
        userId: user.id,
        email: user.email,
        claims: { sub: ancienSub, email: user.email },
      });

      const capture = espionnerCapture();

      // Nouveau sub pour le même (user, provider) : l'agent a changé de
      // fournisseur d'identité amont. L'upsert part en UPDATE, ce n'est pas
      // une nouvelle liaison — c'est ce que détecte le `xmax = 0`.
      const nouveauSub = `sub-rotation-apres-${crypto.randomUUID()}`;
      await service.authentifier(
        'proconnect',
        buildClaims({ sub: nouveauSub, email: user.email })
      );

      expect(capture).not.toHaveBeenCalled();
    });
  });

  describe("rattachement automatique à l'organisation du jeton", () => {
    /**
     * Un service de l'État de test, avec son SIRET, et le nettoyage de ce que
     * le rattachement y écrira — les droits retiennent la collectivité (clé
     * étrangère sans action en cascade), et `onTestFinished` les défait dans
     * l'ordre inverse de leur déclaration. Le code de région est tiré libre :
     * une DREAL est unique par région (cf. `pickFreeRegionCode`).
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
      onTestFinished(async () => {
        await databaseService.db
          .delete(utilisateurCollectiviteAccessTable)
          .where(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectivite.id
            )
          );
      });
      return collectivite;
    }

    async function connecterAvecSiret(
      userId: string,
      email: string,
      siret: string
    ) {
      const sub = `sub-rattachement-${crypto.randomUUID()}`;
      await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
        provider: 'proconnect',
        sub,
        userId,
        email,
      });
      return service.authentifier(
        'proconnect',
        buildClaims({ sub, email, siret })
      );
    }

    async function lireDroit(userId: string, collectiviteId: number) {
      const [droit] = await databaseService.db
        .select()
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, userId),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectiviteId
            )
          )
        );
      return droit;
    }

    /**
     * À chaque connexion, pas seulement à la création du compte : un agent qui
     * avait déjà un compte TeT avant cette bascule doit lui aussi entrer dans
     * son service.
     */
    test('un compte antérieur entre dans son service à la connexion', async () => {
      const { user, cleanup } = await addTestCollectiviteAndUser(
        databaseService
      );
      onTestFinished(cleanup);
      const dreal = await addService('999555111', '00042');

      const resultat = await connecterAvecSiret(
        user.id,
        user.email,
        '99955511100042'
      );

      expect(resultat).toMatchObject({
        statut: 'connexion',
        rattachement: {
          collectiviteId: dreal.id,
          nom: dreal.nom,
          type: 'dreal',
        },
      });
      expect(await lireDroit(user.id, dreal.id)).toMatchObject({
        role: 'edition',
        isActive: true,
      });
    });

    /**
     * Un administrateur qui retire un accès laisse une ligne inactive derrière
     * lui. La voir revenir à la connexion suivante annulerait sa décision.
     */
    test('un droit retiré ne revient pas', async () => {
      const { user, cleanup } = await addTestCollectiviteAndUser(
        databaseService
      );
      onTestFinished(cleanup);
      const dreal = await addService('999555222', '00042');

      await databaseService.db
        .insert(utilisateurCollectiviteAccessTable)
        .values({
          userId: user.id,
          collectiviteId: dreal.id,
          isActive: false,
          role: CollectiviteRole.EDITION,
        });

      const resultat = await connecterAvecSiret(
        user.id,
        user.email,
        '99955522200042'
      );

      expect(resultat).toMatchObject({ statut: 'connexion' });
      expect(resultat).not.toHaveProperty('rattachement');
      expect(await lireDroit(user.id, dreal.id)).toMatchObject({
        isActive: false,
      });
    });

    /** Et un droit existant n'est jamais élevé : le rattachement n'ouvre, il ne promeut pas. */
    test('un droit existant garde son niveau', async () => {
      const { user, cleanup } = await addTestCollectiviteAndUser(
        databaseService
      );
      onTestFinished(cleanup);
      const dreal = await addService('999555333', '00042');

      await databaseService.db
        .insert(utilisateurCollectiviteAccessTable)
        .values({
          userId: user.id,
          collectiviteId: dreal.id,
          isActive: true,
          role: CollectiviteRole.LECTURE,
        });

      await connecterAvecSiret(user.id, user.email, '99955533300042');

      expect(await lireDroit(user.id, dreal.id)).toMatchObject({
        role: 'lecture',
        isActive: true,
      });
    });
  });
});
