import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { Result } from '@tet/backend/utils/result.type';
import { eq } from 'drizzle-orm';
import { DateTime } from 'luxon';
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ContextStoreService } from '../context/context.service';
import { CustomZodValidationPipe } from '../nest/custom-zod-validation.pipe';
import {
  NotificationStatusEnum,
  NotificationStatusType,
} from './models/notification-status.enum';
import { NotificationContentGenerator } from './models/notification-template.dto';
import { notificationTable } from './models/notification.table';
import { NotifiedOnEnum, NotifiedOnType } from './models/notified-on.enum';
import { NotificationsService } from './notifications.service';

// Constantes pour les données de test
const TEST_EMAIL = 'test@example.com';
const TEST_SUBJECT = 'Test Subject';
const TEST_CONTENT = 'Test Content';
const DEFAULT_DELAY_MINUTES = 20;
const RECENT_DELAY_MINUTES = 5;

describe('NotificationsService', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let notificationsService: NotificationsService;
  let emailServiceMock: {
    sendEmail: ReturnType<typeof vi.fn>;
  };
  const testUsers: Array<{ userId: string; cleanup: () => Promise<void> }> = [];

  // Helpers pour créer des données de test
  const createTestUser = async () => {
    const { user, cleanup } = await addTestUser(databaseService);
    const userId = user.userId;
    testUsers.push({ userId, cleanup });
    return userId;
  };

  const createSuccessGeneratorMock = (): NotificationContentGenerator => {
    return vi.fn().mockResolvedValue({
      success: true,
      data: {
        sendToEmail: TEST_EMAIL,
        subject: TEST_SUBJECT,
        content: React.createElement('div', null, TEST_CONTENT),
      },
    });
  };

  const createErrorGeneratorMock = (
    errorMessage = 'Erreur de génération'
  ): NotificationContentGenerator => {
    return vi.fn().mockResolvedValue({
      success: false,
      error: errorMessage,
    } as { success: false; error: string });
  };

  const registerGenerator = (
    generator: NotificationContentGenerator,
    notifiedOn: NotifiedOnType = NotifiedOnEnum.UPDATE_FICHE_PILOTE
  ) => {
    notificationsService.registerContentGenerator(notifiedOn, generator);
  };

  const createTestNotification = async (
    userId: string,
    options: {
      entityId: string;
      delayMinutes?: number;
      status?: NotificationStatusType;
      notifiedOn?: NotifiedOnType;
      notificationData?: Record<string, unknown>;
    }
  ) => {
    const {
      entityId,
      delayMinutes = DEFAULT_DELAY_MINUTES,
      status = NotificationStatusEnum.PENDING,
      notifiedOn = NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      notificationData = { test: 'data' },
    } = options;

    return await databaseService.db
      .insert(notificationTable)
      .values({
        entityId,
        sendTo: userId,
        status,
        notifiedOn,
        notificationData,
        createdAt: DateTime.now()
          .minus({ minutes: delayMinutes })
          .toUTC()
          .toSQL(),
      })
      .returning();
  };

  beforeEach(async () => {
    // Crée un mock pour EmailService
    emailServiceMock = {
      sendEmail: vi.fn().mockResolvedValue({
        success: true,
        data: { messageId: 'test-message-id' },
      } as Result<{ messageId: string }, never>),
    };

    // Crée l'app de test avec le EmailService mocké
    const moduleRefPromise = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailServiceMock);

    const moduleRef = await moduleRefPromise.compile();

    app = moduleRef.createNestApplication();
    const contextStoreService = app.get(ContextStoreService);
    app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));
    await app.init();

    databaseService = await getTestDatabase(app);
    notificationsService = app.get(NotificationsService);
  });

  afterEach(async () => {
    try {
      // Nettoie d'abord les notifications associées aux utilisateurs de test
      // (doit être fait avant de supprimer les utilisateurs à cause de la contrainte de clé étrangère)
      for (const user of testUsers) {
        try {
          await databaseService.db
            .delete(notificationTable)
            .where(eq(notificationTable.sendTo, user.userId));
        } catch (error) {
          console.error(
            `Erreur lors de la suppression des notifications pour l'utilisateur ${user.userId}:`,
            error
          );
        }
      }

      // Nettoie les utilisateurs de test
      for (const user of testUsers) {
        try {
          await user.cleanup();
        } catch (error) {
          console.error(
            `Erreur lors du cleanup de l'utilisateur ${user.userId}:`,
            error
          );
        }
      }

      testUsers.length = 0;

      // Nettoie toutes les notifications restantes (au cas où)
      try {
        await databaseService.db.delete(notificationTable);
      } catch (error) {
        console.error(
          'Erreur lors de la suppression des notifications:',
          error
        );
      }
    } finally {
      await app.close();
    }
  });

  test('sendPendingNotifications appelle le générateur enregistré pour chaque notification pending', async () => {
    const userId = await createTestUser();
    const generatorMock = createSuccessGeneratorMock();
    registerGenerator(generatorMock);

    const notification1 = await createTestNotification(userId, {
      entityId: 'test-entity-1',
      notificationData: { test: 'data1' },
    });

    const notification2 = await createTestNotification(userId, {
      entityId: 'test-entity-2',
      notificationData: { test: 'data2' },
    });

    await notificationsService.sendPendingNotifications();

    expect(generatorMock).toHaveBeenCalledTimes(2);
    expect(generatorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: notification1[0].id,
        entityId: 'test-entity-1',
        notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      })
    );
    expect(generatorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: notification2[0].id,
        entityId: 'test-entity-2',
        notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      })
    );

    expect(emailServiceMock.sendEmail).toHaveBeenCalledTimes(2);
    expect(emailServiceMock.sendEmail).toHaveBeenCalledWith({
      to: TEST_EMAIL,
      subject: TEST_SUBJECT,
      html: expect.stringMatching(/<div>Test Content<\/div>/),
    });
  });

  test('sendPendingNotifications ne traite pas les notifications créées récemment (respect du délai)', async () => {
    const userId = await createTestUser();
    const generatorMock = createSuccessGeneratorMock();
    registerGenerator(generatorMock);

    await createTestNotification(userId, {
      entityId: 'test-entity-recent',
      delayMinutes: RECENT_DELAY_MINUTES,
    });

    await notificationsService.sendPendingNotifications();

    expect(generatorMock).not.toHaveBeenCalled();
    expect(emailServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  test('sendPendingNotifications ignore les notifications sans générateur enregistré', async () => {
    const userId = await createTestUser();

    await createTestNotification(userId, {
      entityId: 'test-entity-no-generator',
    });

    await notificationsService.sendPendingNotifications();

    expect(emailServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  test('sendPendingNotifications ignore les notifications si le générateur retourne success: false', async () => {
    const userId = await createTestUser();
    const generatorMock = createErrorGeneratorMock();
    registerGenerator(generatorMock);

    await createTestNotification(userId, {
      entityId: 'test-entity-error',
    });

    await notificationsService.sendPendingNotifications();

    expect(generatorMock).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.sendEmail).not.toHaveBeenCalled();
  });

  test('sendPendingNotifications met à jour le statut de la notification après envoi réussi', async () => {
    const userId = await createTestUser();
    const generatorMock = createSuccessGeneratorMock();
    registerGenerator(generatorMock);

    const [notification] = await createTestNotification(userId, {
      entityId: 'test-entity-status',
    });

    await notificationsService.sendPendingNotifications();

    const updatedNotification = await databaseService.db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.id, notification.id))
      .then((rows) => rows[0]);

    expect(updatedNotification.status).toBe(NotificationStatusEnum.SENT);
    expect(updatedNotification.sentToEmail).toBe(TEST_EMAIL);
    expect(updatedNotification.sentAt).not.toBeNull();
  });
});
