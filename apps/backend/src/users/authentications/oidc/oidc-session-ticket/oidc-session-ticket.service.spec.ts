import { JwtService } from '@nestjs/jwt';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { OidcSessionTicketService } from './oidc-session-ticket.service';

const SECRET = 'test-ticket-secret';

const claims = {
  sub: 'sub-1',
  email: 'agent@collectivite.fr',
  email_verified: true,
  given_name: 'Jeanne',
  usual_name: 'Dupont',
};

function createService() {
  const configurationService = {
    get: (key: string) => (key === 'OIDC_TICKET_SECRET' ? SECRET : undefined),
  } as unknown as ConfigurationService;
  return new OidcSessionTicketService(new JwtService(), configurationService);
}

describe('OidcSessionTicketService — ticket signé du parcours de bienvenue (cas 3, U5)', () => {
  test('signe puis vérifie un ticket valide', () => {
    const service = createService();
    const ticket = service.signer({ provider: 'proconnect', claims });

    const result = service.verifier(ticket);

    expect(result).toEqual({
      success: true,
      data: { provider: 'proconnect', claims },
    });
  });

  test('ticket signé avec un autre secret → rejeté', () => {
    const service = createService();
    const other = new OidcSessionTicketService(new JwtService(), {
      get: () => 'un-autre-secret',
    } as unknown as ConfigurationService);
    const ticket = other.signer({ provider: 'proconnect', claims });

    const result = service.verifier(ticket);

    expect(result).toMatchObject({ success: false, error: 'TICKET_INVALIDE' });
  });

  test('ticket malformé → rejeté', () => {
    const service = createService();

    const result = service.verifier('pas-un-jwt');

    expect(result).toMatchObject({ success: false, error: 'TICKET_INVALIDE' });
  });

  test('ticket expiré → TICKET_EXPIRE', () => {
    const service = createService();
    const jwtService = new JwtService();
    const expired = jwtService.sign(
      { provider: 'proconnect', claims },
      { secret: SECRET, expiresIn: -1 }
    );

    const result = service.verifier(expired);

    expect(result).toMatchObject({ success: false, error: 'TICKET_EXPIRE' });
  });

  test('claims invalides dans le ticket décodé → TICKET_INVALIDE', () => {
    const service = createService();
    const jwtService = new JwtService();
    const ticket = jwtService.sign(
      { provider: 'proconnect', claims: { sub: 'x' } },
      { secret: SECRET, expiresIn: 900 }
    );

    const result = service.verifier(ticket);

    expect(result).toMatchObject({ success: false, error: 'TICKET_INVALIDE' });
  });
});
