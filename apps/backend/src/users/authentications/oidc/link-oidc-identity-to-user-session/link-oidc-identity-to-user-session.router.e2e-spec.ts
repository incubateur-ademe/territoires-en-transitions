import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { OidcSessionTicketService } from '../oidc-session-ticket/oidc-session-ticket.service';

function buildClaims(overrides: Partial<OidcClaims> & { email: string }) {
  return {
    sub: `sub-${crypto.randomUUID()}`,
    email_verified: true,
    given_name: 'Jeanne',
    usual_name: 'Dupont',
    ...overrides,
  } satisfies OidcClaims;
}

describe('LinkOidcIdentityToUserSessionRouter — liaison cas 3 « Oui » après re-connexion classique (U5)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let ticketOidcService: OidcSessionTicketService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    ticketOidcService = app.get(OidcSessionTicketService);

    return async () => {
      await app.close();
    };
  });

  async function creerUtilisateur() {
    const { user, cleanup } = await addTestCollectiviteAndUser(databaseService);
    onTestFinished(cleanup);
    return { user, authUser: getAuthUserFromUserCredentials(user) };
  }

  function creerTicket(claims: OidcClaims) {
    return ticketOidcService.signer({ provider: 'proconnect', claims });
  }

  async function getIdentite(provider: 'proconnect', sub: string) {
    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, provider),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    return identite;
  }

  test('lève une erreur si non authentifié', async () => {
    const caller = router.createCaller({ user: null });
    const claims = buildClaims({ email: 'inconnu@example.com' });

    await expect(() =>
      caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('ticket valide + sub jamais lié → rattachement réussi vers ctx.user.id', async () => {
    const { user, authUser } = await creerUtilisateur();
    const caller = router.createCaller({ user: authUser });
    const claims = buildClaims({ email: user.email });

    const result =
      await caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      });

    expect(result).toEqual({ email: claims.email });

    const identite = await getIdentite('proconnect', claims.sub);
    expect(identite).toBeDefined();
    expect(identite.userId).toBe(user.id);
  });

  test('sub déjà lié à un AUTRE compte → IDENTITE_DEJA_LIEE_AILLEURS, rien modifié', async () => {
    const { user: proprietaire } = await creerUtilisateur();
    const { authUser: intrusAuthUser } = await creerUtilisateur();

    const sub = `sub-vole-${crypto.randomUUID()}`;
    await databaseService.db.insert(utilisateurIdentiteOidcTable).values({
      provider: 'proconnect',
      sub,
      userId: proprietaire.id,
      email: proprietaire.email,
      claims: { sub, email: proprietaire.email },
    });

    const caller = router.createCaller({ user: intrusAuthUser });
    const claims = buildClaims({ sub, email: proprietaire.email });

    await expect(() =>
      caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      })
    ).rejects.toMatchObject({
      message: expect.stringMatching(/déjà associée/),
    });

    const identite = await getIdentite('proconnect', sub);
    expect(identite.userId).toBe(proprietaire.id);
  });

  test('ticket expiré → erreur typée, rien créé', async () => {
    const { authUser } = await creerUtilisateur();
    const caller = router.createCaller({ user: authUser });
    const claims = buildClaims({ email: 'expire@example.com' });

    // Ticket signé avec un TTL négatif : expiré immédiatement. On resigne
    // avec le même secret que le service (config réelle de l'app de test).
    const secret = app
      .get(ConfigurationService)
      .get('OIDC_TICKET_SECRET') as string;
    const expiredTicket = new JwtService().sign(
      { provider: 'proconnect', claims },
      { secret, expiresIn: -1 }
    );

    await expect(() =>
      caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: expiredTicket,
      })
    ).rejects.toMatchObject({
      message: expect.stringMatching(/expiré/),
    });

    const identite = await getIdentite('proconnect', claims.sub);
    expect(identite).toBeUndefined();
  });

  test('ticket invalide (malformé) → erreur typée, rien créé', async () => {
    const { authUser } = await creerUtilisateur();
    const caller = router.createCaller({ user: authUser });

    await expect(() =>
      caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: 'pas-un-jwt',
      })
    ).rejects.toMatchObject({
      message: expect.stringMatching(/invalide/),
    });
  });

  test('rejouer le rattachement pour le même compte est idempotent (upsert)', async () => {
    const { user, authUser } = await creerUtilisateur();
    const caller = router.createCaller({ user: authUser });
    const claims = buildClaims({ email: user.email });

    const premierResultat =
      await caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      });
    expect(premierResultat).toEqual({ email: claims.email });

    const deuxiemeResultat =
      await caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      });
    expect(deuxiemeResultat).toEqual({ email: claims.email });

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
    expect(lignes[0].sub).toBe(claims.sub);
  });

  test('compte de la session courante supprimé (dcp.deleted) → COMPTE_SUPPRIME', async () => {
    const { user, authUser } = await creerUtilisateur();
    await databaseService.db
      .update(dcpTable)
      .set({ deleted: true })
      .where(eq(dcpTable.id, user.id));

    const caller = router.createCaller({ user: authUser });
    const claims = buildClaims({ email: user.email });

    await expect(() =>
      caller.users.authentications.oidc.linkIdentityToUserSession({
        ticket: creerTicket(claims),
      })
    ).rejects.toMatchObject({ message: expect.stringMatching(/supprimé/) });

    const identite = await getIdentite('proconnect', claims.sub);
    expect(identite).toBeUndefined();
  });
});
