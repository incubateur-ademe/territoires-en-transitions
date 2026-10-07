import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { Result } from '@tet/backend/utils/result.type';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { and, eq, isNull } from 'drizzle-orm';
import { beforeAll, describe, expect, onTestFinished, test, vi } from 'vitest';
import { OidcClaims } from '../oidc.models';
import { utilisateurIdentiteOidcInvitationTable } from '../models/utilisateur-identite-oidc-invitation.table';
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

describe('InviteUserToLinkOidcIdentityRouter — fallback « mot de passe oublié » (U5)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let ticketOidcService: OidcSessionTicketService;
  let emailServiceMock: { sendEmail: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    emailServiceMock = {
      sendEmail: vi.fn().mockResolvedValue({
        success: true,
        data: { messageId: 'test-message-id' },
      } as Result<{ messageId: string }, never>),
    };

    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder.overrideProvider(EmailService).useValue(emailServiceMock);
      },
    });
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
    return user;
  }

  function creerTicket(claims: OidcClaims) {
    return ticketOidcService.signer({ provider: 'proconnect', claims });
  }

  async function getDemandesPendantes(provider: 'proconnect', sub: string) {
    return databaseService.db
      .select()
      .from(utilisateurIdentiteOidcInvitationTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcInvitationTable.provider, provider),
          eq(utilisateurIdentiteOidcInvitationTable.sub, sub),
          isNull(utilisateurIdentiteOidcInvitationTable.confirmedAt)
        )
      );
  }

  test('compte existant à l’ancien email → succès générique, une demande créée, email envoyé à l’ANCIEN email', async () => {
    const user = await creerUtilisateur();
    const caller = router.createCaller({ user: null });
    const claims = buildClaims({
      email: 'nouvel-email-proconnect@example.com',
    });

    const result =
      await caller.users.authentications.oidc.inviteUserToLinkIdentity({
        ticket: creerTicket(claims),
        initialMail: user.email,
      });

    expect(result).toEqual({ statut: 'email-envoye-si-compte-existant' });

    const demandes = await getDemandesPendantes('proconnect', claims.sub);
    expect(demandes).toHaveLength(1);
    expect(demandes[0].userId).toBe(user.id);
    expect(demandes[0].initialMail).toBe(user.email);
    expect(demandes[0].emailProvider).toBe(claims.email);
    // le token brut (base64url ~43 car.) n'est jamais stocké : seul son hash
    // sha256 (64 caractères hex) l'est — incompatible avec le format du token
    // en clair (cf. oidc-invitation-token.utils).
    expect(demandes[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);

    expect(emailServiceMock.sendEmail).toHaveBeenCalledTimes(1);
    const emailArgs = emailServiceMock.sendEmail.mock.calls[0][0];
    // l'email de confirmation part vers l'ANCIEN email, jamais l'email ProConnect
    expect(emailArgs.to).toBe(user.email);
    expect(emailArgs.html).toContain('confirmer-rattachement');
  });

  test('compte inexistant à l’ancien email → même succès générique, rien créé, aucun email envoyé', async () => {
    emailServiceMock.sendEmail.mockClear();
    const caller = router.createCaller({ user: null });
    const claims = buildClaims({ email: 'proconnect-inconnu@example.com' });
    const initialMailInconnu = `inconnu-${crypto.randomUUID()}@example.com`;

    const result =
      await caller.users.authentications.oidc.inviteUserToLinkIdentity({
        ticket: creerTicket(claims),
        initialMail: initialMailInconnu,
      });

    expect(result).toEqual({ statut: 'email-envoye-si-compte-existant' });

    const demandes = await getDemandesPendantes('proconnect', claims.sub);
    expect(demandes).toHaveLength(0);
    expect(emailServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  test('compte dcp.deleted à l’ancien email → traité comme inexistant, succès générique, rien créé', async () => {
    emailServiceMock.sendEmail.mockClear();
    const user = await creerUtilisateur();
    await databaseService.db
      .update(dcpTable)
      .set({ deleted: true })
      .where(eq(dcpTable.id, user.id));

    const caller = router.createCaller({ user: null });
    const claims = buildClaims({ email: 'proconnect-deleted@example.com' });

    const result =
      await caller.users.authentications.oidc.inviteUserToLinkIdentity({
        ticket: creerTicket(claims),
        initialMail: user.email,
      });

    expect(result).toEqual({ statut: 'email-envoye-si-compte-existant' });
    const demandes = await getDemandesPendantes('proconnect', claims.sub);
    expect(demandes).toHaveLength(0);
    expect(emailServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  test('ticket expiré → erreur typée, rien créé', async () => {
    const user = await creerUtilisateur();
    const caller = router.createCaller({ user: null });
    const claims = buildClaims({ email: 'expire@example.com' });

    const secret = app
      .get(ConfigurationService)
      .get('OIDC_TICKET_SECRET') as string;
    const expiredTicket = new JwtService().sign(
      { provider: 'proconnect', claims },
      { secret, expiresIn: -1 }
    );

    await expect(() =>
      caller.users.authentications.oidc.inviteUserToLinkIdentity({
        ticket: expiredTicket,
        initialMail: user.email,
      })
    ).rejects.toMatchObject({ message: expect.stringMatching(/expiré/) });

    const demandes = await getDemandesPendantes('proconnect', claims.sub);
    expect(demandes).toHaveLength(0);
  });

  test('ticket invalide (malformé) → erreur typée', async () => {
    const user = await creerUtilisateur();
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.users.authentications.oidc.inviteUserToLinkIdentity({
        ticket: 'pas-un-jwt',
        initialMail: user.email,
      })
    ).rejects.toMatchObject({ message: expect.stringMatching(/invalide/) });
  });

  test('renvoi (2e appel pour le même provider/sub) → l’ancienne demande pendante est remplacée, une seule ligne pendante subsiste', async () => {
    emailServiceMock.sendEmail.mockClear();
    const user = await creerUtilisateur();
    const caller = router.createCaller({ user: null });
    const claims = buildClaims({ email: 'renvoi@example.com' });

    await caller.users.authentications.oidc.inviteUserToLinkIdentity({
      ticket: creerTicket(claims),
      initialMail: user.email,
    });
    const premieresDemandes = await getDemandesPendantes(
      'proconnect',
      claims.sub
    );
    expect(premieresDemandes).toHaveLength(1);
    const premierTokenHash = premieresDemandes[0].tokenHash;

    // renvoi : même ticket (même sub), même ancien email
    await caller.users.authentications.oidc.inviteUserToLinkIdentity({
      ticket: creerTicket(claims),
      initialMail: user.email,
    });

    const demandesApresRenvoi = await getDemandesPendantes(
      'proconnect',
      claims.sub
    );
    expect(demandesApresRenvoi).toHaveLength(1);
    expect(demandesApresRenvoi[0].tokenHash).not.toBe(premierTokenHash);
    expect(emailServiceMock.sendEmail).toHaveBeenCalledTimes(2);
  });
});
