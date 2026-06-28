import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Initialise APP_URL avant tout import de module (vi.hoisted est hoissé au même
// niveau que vi.mock, avant les imports statiques — nécessaire car APP_URL est
// une constante de module évaluée au chargement).
const { mockedGetAuthUser, mockedDcpFetch, mockedSendEmail } = vi.hoisted(() => ({
  mockedGetAuthUser: vi.fn(),
  mockedDcpFetch: vi.fn(),
  mockedSendEmail: vi.fn(),
}));

vi.hoisted(() => {
  process.env.APP_URL = 'https://app.territoiresentransitions.fr';
  delete process.env.NEXT_PUBLIC_APP_URL;
});

// Neutralise le guard `server-only` (non disponible en environnement jsdom)
vi.mock('server-only', () => ({}));

vi.mock('@tet/api/utils/supabase/server-client', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock('@tet/api/utils/supabase/auth-user.server', () => ({
  getAuthUser: mockedGetAuthUser,
}));

vi.mock('@tet/api/users/dcp.fetch', () => ({
  dcpFetch: mockedDcpFetch,
}));

// NB : on cible le module via son chemin relatif (et non l'alias `@/app/...`)
// car vitest n'applique pas l'alias tsconfig de façon fiable aux chemins passés
// à `vi.mock`, ce qui laissait le vrai `sendEmail` (nodemailer) s'exécuter.
vi.mock('../../../src/utils/send-email', () => ({
  sendEmail: mockedSendEmail,
}));

import { OPTIONS, POST } from './route';

const APP_URL = 'https://app.territoiresentransitions.fr';

const fakeAuthUser = { id: 'user-123', email: 'user@example.com' };
const fakeDcp = {
  user_id: 'user-123',
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'user@example.com',
};

const validInvitationPayload = {
  urlType: 'invitation' as const,
  to: 'destinataire@example.com',
  collectivite: 'Commune de Lyon',
  invitationId: '550e8400-e29b-41d4-a716-446655440000',
};

const validRattachementPayload = {
  urlType: 'rattachement' as const,
  to: 'destinataire@example.com',
  collectivite: 'CA Grand Paris Sud (91)',
  collectiviteId: 42,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAuthenticatedSender() {
  mockedGetAuthUser.mockResolvedValue(fakeAuthUser as never);
  mockedDcpFetch.mockResolvedValue(fakeDcp as never);
}

describe('POST /invite', () => {
  const originalAppUrl = process.env.APP_URL;
  const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_URL = APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
    if (originalNextPublicAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalNextPublicAppUrl;
    }
  });

  describe('Happy path — urlType: invitation', () => {
    it('appelle sendEmail une fois et retourne le résultat (R5)', async () => {
      mockAuthenticatedSender();
      const sendResult = { messageId: '<msg-id@smtp>' };
      mockedSendEmail.mockResolvedValue(sendResult as never);

      const response = await POST(makeRequest(validInvitationPayload));

      expect(response.status).toBe(200);
      expect(mockedSendEmail).toHaveBeenCalledOnce();

      const [callArg] = mockedSendEmail.mock.calls[0];
      expect(callArg.to).toBe('destinataire@example.com');
      expect(callArg.subject).toContain('Jean Dupont');
      expect(callArg.subject).toContain('Commune de Lyon');
      expect(callArg.html).toContain('user@example.com');

      const expectedUrl = `${APP_URL}/invitation/550e8400-e29b-41d4-a716-446655440000`;
      expect(callArg.html).toContain(expectedUrl);
      expect(callArg.html).not.toContain(
        encodeURIComponent('destinataire@example.com')
      );

      const body = await response.json();
      expect(body).toEqual(sendResult);
    });
  });

  describe('Happy path — nom de collectivité avec dièse', () => {
    it('accepte un nom de collectivité démo préfixé par « # » (édition)', async () => {
      mockAuthenticatedSender();
      mockedSendEmail.mockResolvedValue({ messageId: '<msg-demo@smtp>' } as never);

      const response = await POST(
        makeRequest({
          ...validInvitationPayload,
          collectivite: '# Collectivité démo (édition)',
        })
      );

      expect(response.status).toBe(200);
      expect(mockedSendEmail).toHaveBeenCalledOnce();

      const [callArg] = mockedSendEmail.mock.calls[0];
      expect(callArg.subject).toContain('# Collectivité démo (édition)');
    });
  });

  describe('Sécurité — identité expéditeur', () => {
    it("ignore un champ `from` fourni par le client et utilise le DCP de l'utilisateur connecté", async () => {
      mockAuthenticatedSender();
      mockedSendEmail.mockResolvedValue({ messageId: '<msg-id@smtp>' } as never);

      const response = await POST(
        makeRequest({
          ...validInvitationPayload,
          from: {
            prenom: 'Attaquant',
            nom: 'Malveillant',
            email: 'phishing@evil.com',
          },
        })
      );

      expect(response.status).toBe(200);
      const [callArg] = mockedSendEmail.mock.calls[0];
      expect(callArg.subject).toContain('Jean Dupont');
      expect(callArg.html).toContain('user@example.com');
      expect(callArg.html).not.toContain('phishing@evil.com');
      expect(callArg.html).not.toContain('Attaquant');
    });
  });

  describe('Erreur — non authentifié', () => {
    it('retourne 403 quand getAuthUser → null', async () => {
      mockedGetAuthUser.mockResolvedValue(null);

      const response = await POST(makeRequest(validInvitationPayload));

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: 'Non autorisé' });
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Erreur — profil incomplet', () => {
    it('retourne 403 quand le DCP est absent', async () => {
      mockedGetAuthUser.mockResolvedValue(fakeAuthUser as never);
      mockedDcpFetch.mockResolvedValue(null);

      const response = await POST(makeRequest(validInvitationPayload));

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: 'Profil incomplet' });
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Erreur — payload invalide', () => {
    it('retourne 400 quand le nom de collectivité contient une balise HTML', async () => {
      mockAuthenticatedSender();

      const response = await POST(
        makeRequest({
          ...validInvitationPayload,
          collectivite: '<script>alert(1)</script>',
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: 'Arguments non valides' });
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Edge — urlType: rattachement', () => {
    it("génère l'URL /collectivite/<id>/accueil dans le HTML", async () => {
      mockAuthenticatedSender();
      mockedSendEmail.mockResolvedValue({ messageId: '<msg-2@smtp>' } as never);

      const response = await POST(makeRequest(validRattachementPayload));

      expect(response.status).toBe(200);
      expect(mockedSendEmail).toHaveBeenCalledOnce();

      const [callArg] = mockedSendEmail.mock.calls[0];
      const expectedUrl = `${APP_URL}/collectivite/42/accueil`;
      expect(callArg.html).toContain(expectedUrl);
    });
  });

  describe('Edge — APP_URL manquante', () => {
    it('retourne 500 quand APP_URL et NEXT_PUBLIC_APP_URL ne sont pas définis', async () => {
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      mockAuthenticatedSender();

      vi.resetModules();

      const { POST: postWithNoUrl } = await import('./route');
      const response = await postWithNoUrl(makeRequest(validInvitationPayload));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: 'Configuration serveur incomplète' });
    });
  });
});

describe('OPTIONS /invite', () => {
  it('retourne 200 pour les requêtes preflight', async () => {
    const response = await OPTIONS();
    expect(response.status).toBe(200);
  });
});
