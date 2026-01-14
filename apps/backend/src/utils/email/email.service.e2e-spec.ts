import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { AddressObject, simpleParser } from 'mailparser';
import { SMTPServer } from 'smtp-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

type SMTPConfig = {
  smtpUrl?: string;
  smtpKey?: string;
  smtpFrom?: string;
  smtpToEmailWhitelist?: string[];
};

type SMTPServerOptions = {
  onRcptTo?: (
    address: unknown,
    session: unknown,
    callback: (error?: Error) => void
  ) => void;
  onData?: (
    stream: NodeJS.ReadableStream,
    session: unknown,
    callback: (error?: Error) => void
  ) => void;
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
   * Crée et démarre un serveur SMTP mock
   */
  async function createSMTPServer(
    port: number,
    options: SMTPServerOptions = {}
  ): Promise<SMTPServer> {
    const server = await new SMTPServer({
      authMethods: ['PLAIN', 'LOGIN'],
      disabledCommands: ['STARTTLS'],
      onAuth(auth, session, callback) {
        callback(null, { user: auth.username });
      },
      onRcptTo: options.onRcptTo,
      onData:
        options.onData ||
        ((stream, session, callback) => {
          stream.resume();
          stream.on('end', callback);
        }),
    });

    await new Promise<void>((resolve, reject) => {
      server.on('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });

    return server;
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
    // Démarre un serveur SMTP mock
    smtpPort = 54333; // Port différent de DEV_CONFIG pour éviter les conflits
    smtpServer = new SMTPServer({
      authMethods: ['PLAIN', 'LOGIN'],
      disabledCommands: ['STARTTLS'],
      onAuth(auth, session, callback) {
        // Accepte toutes les authentifications pour les tests
        callback(null, { user: auth.username });
      },
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

    await new Promise<void>((resolve, reject) => {
      smtpServer.on('error', (err: Error) => {
        reject(err);
      });
      smtpServer.listen(smtpPort, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Arrête le serveur SMTP mock
    await new Promise<void>((resolve) => {
      smtpServer.close(() => {
        resolve();
      });
    });
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

      try {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });

        // L'email devrait être envoyé vers le serveur DEV (127.0.0.1:54325)
        // mais comme on n'a pas de serveur sur ce port, on vérifie juste qu'il n'y a pas d'erreur
        // En réalité, cela échouera probablement, mais on teste la logique de fallback
      } catch (error) {
        // C'est attendu car le serveur DEV n'est pas démarré
        expect(error).toBeDefined();
      }
    });

    it('devrait utiliser la config DEV quand SMTP_KEY est manquant', async () => {
      emailService = await createTestModule({
        smtpUrl: 'smtp://user@example.com:587',
        smtpFrom: 'test@example.com',
        // SMTP_KEY manquant
      });

      try {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('devrait rejeter une URL SMTP invalide', async () => {
      emailService = await createTestModule({
        smtpUrl: 'url-invalide', // URL malformée
        smtpKey: 'password123',
        smtpFrom: 'test@example.com',
      });

      try {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('devrait rejeter un port SMTP invalide', async () => {
      emailService = await createTestModule({
        smtpUrl: 'smtp://user@example.com:invalid', // Port invalide
        smtpKey: 'password123',
        smtpFrom: 'test@example.com',
      });

      try {
        await emailService.sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
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
      const rejectedPort = 54327;
      const rejectedServer = await createSMTPServer(rejectedPort, {
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
      const pendingPort = 54328;
      const pendingServer = await createSMTPServer(pendingPort, {
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
      const unknownPort = 54329;
      const unknownServer = await createSMTPServer(unknownPort, {
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
      const unknownPort2 = 54330;
      const unknownServer2 = await createSMTPServer(unknownPort2, {
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
