import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Initialise APP_URL avant tout import de module (vi.hoisted est hoissé au même
// niveau que vi.mock, avant les imports statiques — nécessaire car APP_URL est
// une constante de module évaluée au chargement).
vi.hoisted(() => {
  process.env.APP_URL = 'https://app.territoiresentransitions.fr';
  delete process.env.NEXT_PUBLIC_APP_URL;
});

// Neutralise le guard `server-only` (non disponible en environnement jsdom)
vi.mock('server-only', () => ({}));

// Mock getAuthUser avant l'import du module sous test
vi.mock('@tet/api/utils/supabase/auth-user.server', () => ({
  getAuthUser: vi.fn(),
}));

// Mock sendEmail pour ne pas toucher au SMTP dans les tests
vi.mock('@/app/auth/utils/sendEmail', () => ({
  sendEmail: vi.fn(),
}));

import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { sendEmail } from '@/app/auth/utils/sendEmail';
import { POST, OPTIONS } from './route';

const mockedGetAuthUser = vi.mocked(getAuthUser);
const mockedSendEmail = vi.mocked(sendEmail);

const APP_URL = 'https://app.territoiresentransitions.fr';

const fakeUser = { id: 'user-123', email: 'user@example.com' };

const validInvitationPayload = {
  urlType: 'invitation' as const,
  to: 'destinataire@example.com',
  from: {
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'jean.dupont@example.com',
  },
  collectivite: 'Commune de Lyon',
  invitationId: '550e8400-e29b-41d4-a716-446655440000',
};

const validRattachementPayload = {
  urlType: 'rattachement' as const,
  to: 'destinataire@example.com',
  from: {
    prenom: 'Marie',
    nom: 'Martin',
    email: 'marie.martin@example.com',
  },
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

describe('POST /invite', () => {
  const originalAppUrl = process.env.APP_URL;
  const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    // APP_URL est une constante de module — s'assurer qu'elle est définie dans
    // le process.env pour les tests qui chargent dynamiquement le module.
    process.env.APP_URL = APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    // Restore env vars
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
      mockedGetAuthUser.mockResolvedValue(fakeUser as never);
      const sendResult = { messageId: '<msg-id@smtp>' };
      mockedSendEmail.mockResolvedValue(sendResult as never);

      const response = await POST(makeRequest(validInvitationPayload));

      expect(response.status).toBe(200);
      expect(mockedSendEmail).toHaveBeenCalledOnce();

      const [callArg] = mockedSendEmail.mock.calls[0];
      expect(callArg.to).toBe('destinataire@example.com');
      expect(callArg.subject).toContain('Jean Dupont');
      expect(callArg.subject).toContain('Commune de Lyon');

      // L'URL dans le HTML doit être générée côté serveur à partir d'APP_URL
      const encodedEmail = encodeURIComponent('destinataire@example.com');
      const expectedUrl = `${APP_URL}/invitation/550e8400-e29b-41d4-a716-446655440000/${encodedEmail}`;
      expect(callArg.html).toContain(expectedUrl);

      const body = await response.json();
      expect(body).toEqual(sendResult);
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

  describe('Erreur — payload invalide', () => {
    it('retourne 400 quand un champ nom contient une balise HTML', async () => {
      mockedGetAuthUser.mockResolvedValue(fakeUser as never);

      const maliciousPayload = {
        ...validInvitationPayload,
        from: {
          ...validInvitationPayload.from,
          nom: '<b>Dupont</b>',
        },
      };

      const response = await POST(makeRequest(maliciousPayload));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: 'Arguments non valides' });
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Edge — urlType: rattachement', () => {
    it("génère l'URL /collectivite/<id>/accueil dans le HTML", async () => {
      mockedGetAuthUser.mockResolvedValue(fakeUser as never);
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
      // Supprime les deux variables d'environnement pour ce test
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      // Le module a déjà été importé et APP_URL est évalué au niveau module.
      // Pour tester ce cas, on re-importe dynamiquement le module avec un
      // registre vidé (resetModules), en s'assurant que les mocks sont toujours actifs.
      vi.resetModules();
      vi.mock('server-only', () => ({}));
      // Note: vi.mock factories are hoisted to file top, so fakeUser cannot be
      // referenced here — use an inline user object instead.
      vi.mock('@tet/api/utils/supabase/auth-user.server', () => ({
        getAuthUser: vi.fn().mockResolvedValue({ id: 'user-123', email: 'user@example.com' }),
      }));
      vi.mock('@/app/auth/utils/sendEmail', () => ({
        sendEmail: vi.fn(),
      }));

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
