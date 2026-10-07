import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { and, eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, describe, expect, onTestFinished, test } from 'vitest';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { utilisateurIdentiteOidcInvitationTable } from '../models/utilisateur-identite-oidc-invitation.table';
import { hashOidcInvitationToken } from '../oidc-invitation-token.utils';

function buildClaims(overrides: Partial<OidcClaims> & { email: string }) {
  return {
    sub: `sub-${crypto.randomUUID()}`,
    email_verified: true,
    given_name: 'Jeanne',
    usual_name: 'Dupont',
    ...overrides,
  } satisfies OidcClaims;
}

describe('ConfirmOidcIdentityLinkedToUserRouter — confirmation du fallback « mot de passe oublié » (U5)', () => {
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
    return user;
  }

  async function creerDemande(options: {
    userId: string;
    claims: OidcClaims;
    initialMail: string;
    expiresAt?: DateTime;
    confirmedAt?: DateTime;
    token?: string;
  }) {
    const token = options.token ?? `token-${crypto.randomUUID()}`;
    const expiresAt = options.expiresAt ?? DateTime.now().plus({ hours: 24 });
    const expiresAtSql = expiresAt.toUTC().toSQL();
    if (!expiresAtSql) {
      throw new Error('expiresAt invalide dans la fixture de test');
    }

    await databaseService.db
      .insert(utilisateurIdentiteOidcInvitationTable)
      .values({
        tokenHash: hashOidcInvitationToken(token),
        provider: 'proconnect',
        sub: options.claims.sub,
        claims: options.claims,
        emailProvider: options.claims.email,
        initialMail: options.initialMail,
        userId: options.userId,
        expiresAt: expiresAtSql,
        confirmedAt: options.confirmedAt
          ? options.confirmedAt.toUTC().toSQL()
          : null,
      });

    return token;
  }

  async function getIdentite(sub: string) {
    const [identite] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.provider, 'proconnect'),
          eq(utilisateurIdentiteOidcTable.sub, sub)
        )
      );
    return identite;
  }

  test('token valide → identité liée, confirmedAt posé', async () => {
    const user = await creerUtilisateur();
    const claims = buildClaims({ email: 'proconnect@example.com' });
    const token = await creerDemande({
      userId: user.id,
      claims,
      initialMail: user.email,
    });

    const caller = router.createCaller({ user: null });
    const result =
      await caller.users.authentications.oidc.confirmIdentityLinkedToUser({
        token,
      });

    expect(result).toEqual({ statut: 'rattachement-confirme' });

    const identite = await getIdentite(claims.sub);
    expect(identite).toBeDefined();
    expect(identite.userId).toBe(user.id);

    const [demande] = await databaseService.db
      .select()
      .from(utilisateurIdentiteOidcInvitationTable)
      .where(
        eq(
          utilisateurIdentiteOidcInvitationTable.tokenHash,
          hashOidcInvitationToken(token)
        )
      );
    expect(demande.confirmedAt).not.toBeNull();
  });

  test('token déjà confirmé (usage unique) → TOKEN_INVALIDE', async () => {
    const user = await creerUtilisateur();
    const claims = buildClaims({ email: 'deja-confirme@example.com' });
    const token = await creerDemande({
      userId: user.id,
      claims,
      initialMail: user.email,
      confirmedAt: DateTime.now().minus({ minutes: 5 }),
    });

    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.users.authentications.oidc.confirmIdentityLinkedToUser({ token })
    ).rejects.toMatchObject({ message: expect.stringMatching(/invalide/) });

    const identite = await getIdentite(claims.sub);
    expect(identite).toBeUndefined();
  });

  test('token expiré → TOKEN_EXPIRE', async () => {
    const user = await creerUtilisateur();
    const claims = buildClaims({ email: 'expire@example.com' });
    const token = await creerDemande({
      userId: user.id,
      claims,
      initialMail: user.email,
      expiresAt: DateTime.now().minus({ minutes: 1 }),
    });

    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.users.authentications.oidc.confirmIdentityLinkedToUser({ token })
    ).rejects.toMatchObject({ message: expect.stringMatching(/expiré/) });

    const identite = await getIdentite(claims.sub);
    expect(identite).toBeUndefined();
  });

  test('token inconnu → TOKEN_INVALIDE', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.users.authentications.oidc.confirmIdentityLinkedToUser({
        token: 'un-token-qui-n-existe-pas',
      })
    ).rejects.toMatchObject({ message: expect.stringMatching(/invalide/) });
  });
});
