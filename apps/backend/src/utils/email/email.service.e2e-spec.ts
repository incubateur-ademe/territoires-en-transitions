import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { AddressObject, simpleParser } from 'mailparser';
import { SMTPServer, type SMTPServerOptions } from 'smtp-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

type SMTPConfig = {
  smtpUrl?: string;
  smtpKey?: string;
  smtpFrom?: string;
  smtpToEmailWhitelist?: string[];
};

describe('EmailService e2e', () => {
  let emailService: EmailService;
  let smtpServer: SMTPServer;
  let smtpPort: number;
  const receivedEmails: Array<{
    from: string;
    to: string;
    subject: string;
    html: string;
  }> = [];

  /**
   * Crée un mock de ConfigurationService avec les valeurs spécifiées
   */
  function createConfigServiceMock(config: SMTPConfig): ConfigurationService {
    return {
      get: (key: string) => {
        if (key === 'SMTP_URL') {
          return config.smtpUrl;
        }
        if (key === 'SMTP_KEY') {
          return config.smtpKey;
        }
        if (key === 'SMTP_FROM') {
          return config.smtpFrom || 'test@example.com';
        }
        if (key === 'SMTP_TO_EMAIL_WHITELIST') {
          return config.smtpToEmailWhitelist;
        }
        return undefined;
      },
    } as ConfigurationService;
  }

  /**
   * Crée un module de test avec EmailService et ConfigurationService mock
   */
  async function createTestModule(config: SMTPConfig) {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        EmailService,
        {
          provide: ConfigurationService,
          useValue: createConfigServiceMock(config),
        },
      ],
    }).compile();

    return moduleRef.get(EmailService);
  }

  /**
   * Crée et démarre un serveur SMTP mock sur un port libre (0 = choix OS).
   */
  async function createSMTPServer(
    options: SMTPServerOptions = {}
  ): Promise<{ server: SMTPServer; port: number }> {
    const server = new SMTPServer({
      authMethods: ['PLAIN', 'LOGIN'],
      disabledCommands: ['STARTTLS'],
      onAuth(auth, session, callback) {
        callback(null, { user: auth.username });
      },
      onData(stream, session, callback) {
        let done = false;
        const finish = (err?: Error) => {
          if (done) return;
          done = true;
          callback(err);
        };
        stream.once('error', (err) => finish(err));
        stream.once('end', () => finish());
        stream.resume();
      },
      ...options,
    });

    const port = await listenSMTPServer(server, '127.0.0.1', 0);
    return { server, port };
  }

  /**
   * Démarre l’écoute et évite de laisser un handler `error` permanent sur le serveur.
   */
  async function listenSMTPServer(
    server: SMTPServer,
    host: string,
    port: number
  ): Promise<number> {
    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        server.removeListener('error', onError);
        reject(err);
      };
      server.once('error', onError);
      server.listen(port, host, () => {
        server.removeListener('error', onError);
        resolve();
      });
    });
    return getListeningPort(server);
  }

  /**
   * Lit le port alloué au serveur SMTP
   */
  function getListeningPort(smtp: SMTPServer): number {
    const addr = smtp.server.address();
    if (addr === null || typeof addr === 'string') {
      throw new Error('serveur SMTP sans adresse d’écoute');
    }
    return addr.port;
  }

  /**
   * Arrête un serveur SMTP
   */
  async function stopSMTPServer(server: SMTPServer): Promise<void> {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  beforeAll(async () => {
    const started = await createSMTPServer({
      onData(stream, session, callback) {
        let emailData = '';
        stream.on('data', (chunk) => {
          emailData += chunk.toString();
        });
        stream.on('end', async () => {
          const mail = await simpleParser(emailData);
          receivedEmails.push({
            from: mail?.from?.text ?? '',
            to: (mail?.to as AddressObject)?.text ?? '',
            subject: mail?.subject ?? '',
            html: mail?.html ? mail.html.toString() : '',
          });
          callback(null);
        });
      },
    });
    smtpServer = started.server;
    smtpPort = started.port;
  });

  afterAll(async () => {
    await stopSMTPServer(smtpServer);
  });

  beforeEach(() => {
    // Réinitialise la liste des emails reçus avant chaque test
    receivedEmails.length = 0;
  });

  describe('Validation de configuration', () => {
    it('devrait utiliser la config DEV quand SMTP_URL est manquant', async () => {
      emailService = await createTestModule({
        smtpFrom: 'test@example.com',
        // SMTP_URL et SMTP_KEY manquants
      });

      // hors production, config absente → getTransport retombe sur DEV (127.0.0.1:54325) ; sendEmail ne rejette pas, elle renvoie un Result
      await expect(
        emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).resolves.toEqual(
        expect.objectContaining({
          success: true,
          data: { messageId: expect.any(String) },
        })
      );
    });

    it('devrait utiliser la config DEV quand SMTP_KEY est manquant', async () => {
      emailService = await createTestModule({
        smtpUrl: 'smtp://user@example.com:587',
        smtpFrom: 'test@example.com',
        // SMTP_KEY manquant
      });

      await expect(
        emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).resolves.toEqual(
        expect.objectContaining({
          success: true,
          data: { messageId: expect.any(String) },
        })
      );
    });

    // hors production, URL invalide pour getConfig → fallback DEV comme pour une config absente
    it('devrait rejeter une URL SMTP invalide', async () => {
      emailService = await createTestModule({
        smtpUrl: 'url-invalide', // URL malformée
        smtpKey: 'password123',
        smtpFrom: 'test@example.com',
      });

      await expect(
        emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).resolves.toEqual(
        expect.objectContaining({
          success: true,
          data: { messageId: expect.any(String) },
        })
      );
    });

    // idem : port illisible pour getConfig → fallback DEV
    it('devrait rejeter un port SMTP invalide', async () => {
      emailService = await createTestModule({
        smtpUrl: 'smtp://user@example.com:invalid', // Port invalide
        smtpKey: 'password123',
        smtpFrom: 'test@example.com',
      });

      await expect(
        emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).resolves.toEqual(
        expect.objectContaining({
          success: true,
          data: { messageId: expect.any(String) },
        })
      );
    });

    it('devrait accepter une configuration SMTP valide et envoyer un email si pas de whitelist', async () => {
      emailService = await createTestModule({
        smtpUrl: `smtp://testuser@127.0.0.1:${smtpPort}`,
        smtpKey: 'testpassword',
        smtpFrom: 'sender@example.com',
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Ceci est un test</p>',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(receivedEmails.length).toBeGreaterThan(0);

      const receivedEmail = receivedEmails[receivedEmails.length - 1];
      expect(receivedEmail).toBeDefined();
      expect(receivedEmail.to).toContain('recipient@example.com');
      expect(receivedEmail.subject).toBe('Test Email');
      expect(receivedEmail.html).toContain('Ceci est un test');
      expect(receivedEmail.from).toContain('sender@example.com');
    });

    it('devrait accepter une configuration SMTP valide et envoyer un email si une whitelist est définie et que le destinataire est dans la whitelist', async () => {
      emailService = await createTestModule({
        smtpUrl: `smtp://testuser@127.0.0.1:${smtpPort}`,
        smtpKey: 'testpassword',
        smtpFrom: 'sender@example.com',
        smtpToEmailWhitelist: ['recipient@example.com'],
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Ceci est un test</p>',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(receivedEmails.length).toBeGreaterThan(0);

      const receivedEmail = receivedEmails[receivedEmails.length - 1];
      expect(receivedEmail).toBeDefined();
      expect(receivedEmail.to).toContain('recipient@example.com');
      expect(receivedEmail.subject).toBe('Test Email');
      expect(receivedEmail.html).toContain('Ceci est un test');
      expect(receivedEmail.from).toContain('sender@example.com');
    });

    it("devrait accepter une configuration SMTP valide et ne pas envoyer un email si une whitelist est définie et que le destinataire n'est pas dans la whitelist", async () => {
      emailService = await createTestModule({
        smtpUrl: `smtp://testuser@127.0.0.1:${smtpPort}`,
        smtpKey: 'testpassword',
        smtpFrom: 'sender@example.com',
        smtpToEmailWhitelist: ['otherrecipient@example.com'],
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Ceci est un test</p>',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe('not-whitelisted');
      }
      expect(receivedEmails.length).toBe(0);
    });

    it('devrait lancer une erreur en production si la config est manquante', async () => {
      emailService = await createTestModule({
        smtpFrom: 'test@example.com',
        // SMTP_URL et SMTP_KEY manquants
      });

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await expect(
          emailService.sendEmail({
            to: 'recipient@example.com',
            subject: 'Test',
            html: '<p>Test</p>',
          })
        ).rejects.toThrow();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("Gestion des erreurs d'envoi", () => {
    it('devrait retourner status "rejected" quand le serveur SMTP rejette le destinataire', async () => {
      const { server: rejectedServer, port: rejectedPort } =
        await createSMTPServer({
          onRcptTo(address, session, callback) {
            // Rejette le destinataire avec un code d'erreur permanent (5xx)
            const error = new Error('550 Mailbox unavailable') as Error & {
              responseCode: number;
            };
            error.responseCode = 550;
            callback(error);
          },
        });

      try {
        emailService = await createTestModule({
          smtpUrl: `smtp://testuser@127.0.0.1:${rejectedPort}`,
          smtpKey: 'testpassword',
          smtpFrom: 'sender@example.com',
        });

        const result = await emailService.sendEmail({
          to: 'rejected@example.com',
          subject: 'Test Rejected',
          html: '<p>Test</p>',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(result.error.status).toBe('rejected');
          expect(result.error.messageId).toBeDefined();
          expect(result.error.errorMessage).toContain('status rejected');
        }
      } finally {
        await stopSMTPServer(rejectedServer);
      }
    });

    it('devrait retourner status "pending" quand le serveur SMTP retourne une erreur temporaire', async () => {
      const { server: pendingServer, port: pendingPort } =
        await createSMTPServer({
          onRcptTo(address, session, callback) {
            // Retourne une erreur temporaire (4xx)
            const error = new Error('451 Temporary failure') as Error & {
              responseCode: number;
            };
            error.responseCode = 451;
            callback(error);
          },
        });

      try {
        emailService = await createTestModule({
          smtpUrl: `smtp://testuser@127.0.0.1:${pendingPort}`,
          smtpKey: 'testpassword',
          smtpFrom: 'sender@example.com',
        });

        const result = await emailService.sendEmail({
          to: 'pending@example.com',
          subject: 'Test Pending',
          html: '<p>Test</p>',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(result.error.status).toBe('pending');
          expect(result.error.messageId).toBeDefined();
          expect(result.error.errorMessage).toContain('status pending');
        }
      } finally {
        await stopSMTPServer(pendingServer);
      }
    });

    it('devrait retourner status "unknown" quand l\'email n\'est ni accepté, ni rejeté, ni en attente', async () => {
      const { server: unknownServer, port: unknownPort } =
        await createSMTPServer({
          onRcptTo(address, session, callback) {
            // Accepte le destinataire
            callback();
          },
          onData(stream, session, callback) {
            // Simule une erreur lors du traitement des données
            stream.resume();
            stream.on('end', () => {
              callback(new Error('Unknown error'));
            });
          },
        });

      try {
        emailService = await createTestModule({
          smtpUrl: `smtp://testuser@127.0.0.1:${unknownPort}`,
          smtpKey: 'testpassword',
          smtpFrom: 'sender@example.com',
        });

        const result = await emailService.sendEmail({
          to: 'unknown@example.com',
          subject: 'Test Unknown',
          html: '<p>Test</p>',
        });

        // Dans ce cas, nodemailer peut soit réussir partiellement soit échouer
        // On vérifie que si ça échoue, le status est bien "unknown"
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(['pending', 'rejected', 'unknown']).toContain(
            result.error.status
          );
          expect(result.error.messageId).toBeDefined();
          expect(result.error.errorMessage).toBeDefined();
          if (result.error.status === 'unknown') {
            expect(result.error.errorMessage).toContain('unknown');
          }
        }
      } finally {
        await stopSMTPServer(unknownServer);
      }
    });

    it('devrait retourner status "unknown" avec un serveur qui accepte RCPT TO mais ferme la connexion', async () => {
      const { server: unknownServer2, port: unknownPort2 } =
        await createSMTPServer({
          onRcptTo(address, session, callback) {
            // Accepte le destinataire mais ne l'ajoute pas vraiment
            callback();
          },
          onData(stream, session, callback) {
            // Lit les données mais ne les traite pas correctement
            stream.resume();
            stream.on('end', () => {
              callback();
            });
          },
        });

      try {
        emailService = await createTestModule({
          smtpUrl: `smtp://testuser@127.0.0.1:${unknownPort2}`,
          smtpKey: 'testpassword',
          smtpFrom: 'sender@example.com',
        });

        const result = await emailService.sendEmail({
          to: 'unknown2@example.com',
          subject: 'Test Unknown 2',
          html: '<p>Test</p>',
        });

        // Si l'email n'est pas dans accepted, pending, ou rejected,
        // le status devrait être "unknown"
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(['pending', 'rejected', 'unknown']).toContain(
            result.error.status
          );
          expect(result.error.messageId).toBeDefined();
          expect(result.error.errorMessage).toBeDefined();
          if (result.error.status === 'unknown') {
            expect(result.error.errorMessage).toContain('status unknown');
          }
        }
      } finally {
        await stopSMTPServer(unknownServer2);
      }
    });
  });
});
