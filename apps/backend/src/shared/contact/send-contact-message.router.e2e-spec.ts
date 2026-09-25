import { INestApplication } from '@nestjs/common';
import {
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SendContactMessageInput } from './send-contact-message.input';
import { siteContactTable } from './site-contact.table';

type SentEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

describe('SendContactMessageRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  const sentEmails: SentEmail[] = [];
  let sendShouldFail = false;

  /**
   * Chaque test appelle avec sa propre IP : les compteurs de `rateLimit` sont
   * par IP, sans ça le test de limite consommerait le quota des autres.
   */
  const callerFromIp = (clientIp: string) =>
    router.createCaller({ user: null, clientIp });

  const buildInput = (
    overrides: Partial<SendContactMessageInput> = {}
  ): SendContactMessageInput => ({
    objet: 'plateforme',
    prenom: 'Camille',
    nom: 'Durand',
    email: `contact-e2e-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@example.org`,
    tel: '',
    message: 'Bonjour, une question sur la plateforme.',
    ...overrides,
  });

  const countTraces = async (email: string) => {
    const rows = await databaseService.db
      .select()
      .from(siteContactTable)
      .where(eq(siteContactTable.email, email));
    return rows;
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder.overrideProvider(EmailService).useValue({
          sendEmail: async (email: SentEmail) => {
            if (sendShouldFail) {
              return {
                success: false,
                error: {
                  status: 'rejected',
                  messageId: null,
                  errorMessage: 'SMTP indisponible (test)',
                },
              };
            }
            sentEmails.push(email);
            return { success: true, data: { messageId: 'test-message-id' } };
          },
        });
      },
    });
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sentEmails.length = 0;
    sendShouldFail = false;
  });

  it("envoie à la boîte de contact et garde une trace, sans avoir besoin d'être authentifié", async () => {
    const input = buildInput({ tel: '0102030405' });

    await callerFromIp('198.51.100.1').shared.contact.send(input);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe('contact@territoiresentransitions.fr');
    expect(sentEmails[0].subject).toBe(
      'Demande de contact depuis le site public - plateforme'
    );
    // Permet de répondre au demandeur : `from` vaut SMTP_FROM.
    expect(sentEmails[0].replyTo).toBe(input.email);
    expect(sentEmails[0].html).toContain('Camille');
    expect(sentEmails[0].html).toContain('0102030405');

    const traces = await countTraces(input.email);
    expect(traces).toHaveLength(1);
    expect(traces[0].formulaire).toMatchObject({
      objet: 'plateforme',
      nom: 'Durand',
      message: 'Bonjour, une question sur la plateforme.',
    });
    // Le piège à robots ne doit pas être journalisé.
    expect(traces[0].formulaire).not.toHaveProperty('website');
  });

  it("route les demandes « programme » vers la boîte de l'ADEME", async () => {
    const input = buildInput({ objet: 'programme' });

    await callerFromIp('198.51.100.2').shared.contact.send(input);

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe('territoireengage@ademe.fr');
  });

  it('échappe le HTML saisi dans le formulaire', async () => {
    const input = buildInput({
      nom: '<script>alert(1)</script>',
      message: 'Message avec <img src=x onerror=alert(1)>',
    });

    await callerFromIp('198.51.100.3').shared.contact.send(input);

    // Le contenu saisi ne doit produire aucune balise : on vérifie l'absence
    // des ouvrantes, pas celle de sous-chaînes comme `onerror=` qui restent
    // inoffensives une fois `<` et `>` échappés.
    expect(sentEmails[0].html).not.toContain('<script>');
    expect(sentEmails[0].html).not.toContain('<img src=x');
    expect(sentEmails[0].html).toContain('&lt;script&gt;');
    expect(sentEmails[0].html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('ignore silencieusement une soumission qui remplit le piège à robots', async () => {
    const input = buildInput({ website: 'http://spam.example' });

    await expect(
      callerFromIp('198.51.100.4').shared.contact.send(input)
    ).resolves.toBeUndefined();

    expect(sentEmails).toHaveLength(0);
    expect(await countTraces(input.email)).toHaveLength(0);
  });

  it("remonte une erreur si l'envoi échoue, mais garde la trace du message", async () => {
    sendShouldFail = true;
    const input = buildInput();

    await expect(
      callerFromIp('198.51.100.5').shared.contact.send(input)
    ).rejects.toThrow();

    // La demande reste consultable en base même si l'email n'est pas parti.
    expect(await countTraces(input.email)).toHaveLength(1);
  });

  it('refuse une adresse email invalide', async () => {
    await expect(
      callerFromIp('198.51.100.6').shared.contact.send(
        buildInput({ email: 'pas-une-adresse' })
      )
    ).rejects.toThrow();

    expect(sentEmails).toHaveLength(0);
  });

  it('limite le nombre de soumissions par IP', async () => {
    const ip = '198.51.100.99';

    // La limite est de 5 par minute (cf. CONTACT_RATE_LIMIT).
    for (let i = 0; i < 5; i++) {
      await callerFromIp(ip).shared.contact.send(buildInput());
    }
    expect(sentEmails).toHaveLength(5);

    await expect(
      callerFromIp(ip).shared.contact.send(buildInput())
    ).rejects.toThrow(/Trop de requêtes/);

    // Une autre IP n'est pas affectée.
    await callerFromIp('198.51.100.98').shared.contact.send(buildInput());
    expect(sentEmails).toHaveLength(6);
  });
});
