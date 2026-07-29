import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, success } from '@tet/backend/utils/result.type';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { OidcSessionTicketService } from '../oidc-session-ticket/oidc-session-ticket.service';
import { CreateUserOidcIdentityController } from './create-user-oidc-identity.controller';
import { CreateUserOidcIdentityService } from './create-user-oidc-identity.service';

const APP_URL = 'https://app.territoiresentransitions.fr';

const ticketOidcServiceMock = {
  verifier: vi.fn(),
};

const creerCompteOidcServiceMock = {
  creerCompte: vi.fn(),
};

async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [CreateUserOidcIdentityController],
    providers: [
      {
        provide: ConfigurationService,
        useValue: {
          get: (key: string) => (key === 'APP_URL' ? APP_URL : undefined),
        },
      },
      { provide: OidcSessionTicketService, useValue: ticketOidcServiceMock },
      {
        provide: CreateUserOidcIdentityService,
        useValue: creerCompteOidcServiceMock,
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1', { exclude: ['version', 'throw'] });
  await app.init();
  return app;
}

describe("CreateUserOidcIdentityController — cas 3-Non (U5), jamais d'erreur 500 nue (R13)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  test('ticket absent → redirection oidc-ticket-expire, aucune création tentée', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/proconnect/creer-compte')
      .expect(303);

    expect(response.headers.location).toBe(
      `${APP_URL}/login?erreur=oidc-ticket-expire`
    );
    expect(creerCompteOidcServiceMock.creerCompte).not.toHaveBeenCalled();
  });

  test('ticket invalide/expiré → redirection oidc-ticket-expire, aucune création tentée', async () => {
    ticketOidcServiceMock.verifier.mockReturnValue(failure('TICKET_EXPIRE'));

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/proconnect/creer-compte?ticket=un-ticket-expire')
      .expect(303);

    expect(response.headers.location).toBe(
      `${APP_URL}/login?erreur=oidc-ticket-expire`
    );
    expect(creerCompteOidcServiceMock.creerCompte).not.toHaveBeenCalled();
  });

  test('ticket valide, création réussie → redirection /auth/verify avec token_hash et next', async () => {
    const claims = {
      sub: 'sub-1',
      email: 'nouvel-agent@collectivite.fr',
      email_verified: true,
      given_name: 'Jeanne',
      usual_name: 'Dupont',
    };
    ticketOidcServiceMock.verifier.mockReturnValue(
      success({ provider: 'proconnect', claims })
    );
    creerCompteOidcServiceMock.creerCompte.mockResolvedValue(
      success({ compteCree: true, hashedToken: 'hashed-token-du-spike' })
    );

    const response = await request(app.getHttpServer())
      .get(
        '/api/v1/auth/proconnect/creer-compte?ticket=un-ticket-valide&next=%2Fplans%2F123'
      )
      .expect(303);

    expect(creerCompteOidcServiceMock.creerCompte).toHaveBeenCalledWith(
      'proconnect',
      claims
    );

    const location = new URL(response.headers.location);
    expect(location.origin).toBe(APP_URL);
    expect(location.pathname).toBe('/auth/verify');
    expect(location.searchParams.get('token_hash')).toBe(
      'hashed-token-du-spike'
    );
    expect(location.searchParams.get('next')).toBe('/plans/123');
  });

  test('échec de création (CREATION_COMPTE_ERROR) → redirection oidc-echec-creation-compte', async () => {
    ticketOidcServiceMock.verifier.mockReturnValue(
      success({
        provider: 'proconnect',
        claims: { sub: 's', email: 'e@e.fr', given_name: 'A', usual_name: 'B' },
      })
    );
    creerCompteOidcServiceMock.creerCompte.mockResolvedValue(
      failure('CREATION_COMPTE_ERROR')
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/proconnect/creer-compte?ticket=un-ticket-valide')
      .expect(303);

    expect(response.headers.location).toBe(
      `${APP_URL}/login?erreur=oidc-echec-creation-compte`
    );
  });

  test('échec du pont de session (SESSION_ERROR) → redirection oidc-echec-session', async () => {
    ticketOidcServiceMock.verifier.mockReturnValue(
      success({
        provider: 'proconnect',
        claims: { sub: 's', email: 'e@e.fr', given_name: 'A', usual_name: 'B' },
      })
    );
    creerCompteOidcServiceMock.creerCompte.mockResolvedValue(
      failure('SESSION_ERROR')
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/proconnect/creer-compte?ticket=un-ticket-valide')
      .expect(303);

    expect(response.headers.location).toBe(
      `${APP_URL}/login?erreur=oidc-echec-session`
    );
  });

  test('exception inattendue → redirection oidc-erreur-interne, jamais de 500', async () => {
    ticketOidcServiceMock.verifier.mockImplementation(() => {
      throw new Error('boom');
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/proconnect/creer-compte?ticket=un-ticket-valide')
      .expect(303);

    expect(response.headers.location).toBe(
      `${APP_URL}/login?erreur=oidc-erreur-interne`
    );
  });
});
