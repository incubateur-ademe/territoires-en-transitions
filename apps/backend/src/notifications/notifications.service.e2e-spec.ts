import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { EmailService } from '@/backend/shared/email/email.service';
import { getAuthUser, getTestDatabase, YOLO_DODO } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { addTestUser } from '@/backend/users/users/users.fixture';
import { ContextStoreService } from '@/backend/utils/context/context.service';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { CustomZodValidationPipe } from '@/backend/utils/nest/custom-zod-validation.pipe';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { AppModule } from '../app.module';
import { createFiche } from '../plans/fiches/fiches.test-fixture';
import {
  NotificationStatusEnum,
  NotificationStatusType,
} from './models/notification-status.enum';
import { notificationTable } from './models/notification.table';
import { NotifiedOnEnum } from './models/notified-on.enum';
import { NotificationsService } from './notifications.service';

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.edition;

describe('NotificationsService - sendPendingNotifications', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;
  let notificationsService: NotificationsService;
  let mockEmailService: {
    sendEmail: ReturnType<typeof vi.fn>;
  };

  const testUsers: Array<{ userId: string; cleanup: () => Promise<void> }> = [];
  const testFicheIds: number[] = [];
  const testNotificationIds: number[] = [];

  beforeAll(async () => {
    // Crée un mock du EmailService
    mockEmailService = {
      sendEmail: vi.fn(),
    };

    // Crée l'app de test avec le EmailService mocké
    const moduleRefPromise = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService);

    const moduleRef = await moduleRefPromise.compile();

    app = moduleRef.createNestApplication();
    const contextStoreService = app.get(ContextStoreService);
    app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));
    await app.init();

    databaseService = await getTestDatabase(app);
    router = app.get(TrpcRouter);
    yoloDodo = await getAuthUser();
    notificationsService = app.get(NotificationsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Nettoyer les notifications de test
    if (testNotificationIds.length > 0) {
      await databaseService.db
        .delete(notificationTable)
        .where(inArray(notificationTable.id, testNotificationIds));
    }

    // Nettoyer les notifications de test par fiche
    if (testFicheIds.length > 0) {
      await databaseService.db.delete(notificationTable).where(
        inArray(
          notificationTable.entityId,
          testFicheIds.map((id) => String(id))
        )
      );
    }

    // Nettoyer les pilotes de test
    if (testFicheIds.length > 0) {
      await databaseService.db
        .delete(ficheActionPiloteTable)
        .where(inArray(ficheActionPiloteTable.ficheId, testFicheIds));
    }

    // Nettoyer les utilisateurs de test
    for (const user of testUsers) {
      await user.cleanup();
    }

    testUsers.length = 0;
    testFicheIds.length = 0;
    testNotificationIds.length = 0;
    vi.clearAllMocks();
  });

  /**
   * Crée un utilisateur de test avec un email
   */
  async function createTestUser() {
    const { cleanup, user } = await addTestUser(databaseService, {
      collectiviteId: COLLECTIVITE_ID,
    });

    testUsers.push({ userId: user.userId, cleanup });
    return user;
  }

  /**
   * Crée une notification de test dans la base de données
   */
  async function createTestNotification({
    ficheId,
    userId,
    status = NotificationStatusEnum.PENDING,
    createdAt,
    createdBy,
    retries = 0,
  }: {
    ficheId: number;
    userId: string;
    status?: NotificationStatusType;
    createdAt?: string;
    createdBy: string;
    retries?: number;
  }) {
    const [notification] = await databaseService.db
      .insert(notificationTable)
      .values({
        entityId: String(ficheId),
        sendTo: userId,
        status,
        notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
        notificationData: { ficheId, piloteId: userId },
        retries,
        createdAt: createdAt || DateTime.now().minus({ minutes: 30 }).toSQL(),
        createdBy,
      })
      .returning();

    testNotificationIds.push(notification.id);
    return notification;
  }

  async function createTestData(
    {
      retries,
      createdAt,
      status,
    }: {
      retries?: number;
      createdAt?: string;
      status?: NotificationStatusType;
    } = {
      retries: 0,
    }
  ) {
    const caller = router.createCaller({ user: yoloDodo });
    const pilote = await createTestUser();
    const admin = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        pilotes: [{ userId: pilote.userId }],
      },
    });
    testFicheIds.push(ficheId);

    const notification = await createTestNotification({
      ficheId,
      userId: pilote.userId,
      createdBy: admin.userId,
      createdAt,
      retries,
      status,
    });
    assert(notification.id);

    return { caller, admin, pilote, notification, ficheId };
  }

  /**
   * Vérifie les notifications dans la base
   */
  async function getNotificationsForFiche(ficheId: number) {
    return await databaseService.db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.entityId, String(ficheId)));
  }

  test('envoie avec succès une notification pending', async () => {
    const { ficheId, pilote } = await createTestData();

    // Configure le mock pour retourner un succès
    mockEmailService.sendEmail.mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie que l'email a été envoyé
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
      to: pilote.email,
      subject: expect.stringContaining('assigné'),
      html: expect.any(String),
    });

    // Vérifie que la notification a été mise à jour
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      status: NotificationStatusEnum.SENT,
      sentToEmail: pilote.email,
      sentAt: expect.any(String),
      retries: 0,
    });
  });

  test('gère un échec temporaire', async () => {
    const { ficheId } = await createTestData();

    // Configure le mock pour retourner un échec temporaire (pending)
    mockEmailService.sendEmail.mockResolvedValue({
      success: false,
      error: {
        status: 'pending',
        messageId: 'test-message-id',
        errorMessage: 'Temporary failure',
      },
    });

    await notificationsService.sendPendingNotifications();

    // Vérifie que l'envoi a été tenté
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);

    // Vérifie que la notification reste en pending avec retry incrémenté
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      status: NotificationStatusEnum.PENDING,
      retries: 1,
      errorMessage: 'Temporary failure',
    });
  });

  test('gère un échec permanent', async () => {
    const { ficheId } = await createTestData();

    // Configure le mock pour retourner un échec permanent (rejected)
    mockEmailService.sendEmail.mockResolvedValue({
      success: false,
      error: {
        status: 'rejected',
        messageId: 'test-message-id',
        errorMessage: 'Permanent failure',
      },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie que l'email a été tenté
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);

    // Vérifie que la notification est marquée comme failed
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      status: NotificationStatusEnum.FAILED,
      retries: 1,
      errorMessage: 'Permanent failure',
    });
  });

  test('marque comme failed après avoir atteint le nombre max de retries', async () => {
    // Crée une notification avec le nombre max de retries
    const { ficheId } = await createTestData({ retries: 4 });

    // Configure le mock pour retourner un échec temporaire
    mockEmailService.sendEmail.mockResolvedValue({
      success: false,
      error: {
        status: 'pending',
        messageId: 'test-message-id',
        errorMessage: 'Temporary failure',
      },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie que l'email a été tenté
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);

    // Vérifie que la notification est marquée comme failed car max retries atteint
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      status: NotificationStatusEnum.FAILED,
      retries: 5,
      errorMessage: 'Temporary failure',
    });
  });

  test('ignore les notifications créées récemment (délai minimum)', async () => {
    // Crée une notification récente
    const { ficheId } = await createTestData({
      retries: 4,
      createdAt: DateTime.now().toUTC().toSQL(),
    });

    // Configure le mock
    mockEmailService.sendEmail.mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie que l'email n'a pas été envoyé (notification trop récente)
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled();

    // Vérifie que la notification reste en pending
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].status).toBe(NotificationStatusEnum.PENDING);
  });

  test('envoie plusieurs notifications en parallèle', async () => {
    const { ficheId, admin, pilote: pilote1 } = await createTestData();
    const pilote2 = await createTestUser();
    const notification = await createTestNotification({
      ficheId,
      userId: pilote2.userId,
      createdBy: admin.userId,
    });
    assert(notification.id);

    // Configure le mock pour retourner un succès
    mockEmailService.sendEmail.mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie que les deux emails ont été envoyés
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2);

    // Vérifie que les deux notifications ont été mises à jour
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
    expect(
      notifications.every((n) => n.status === NotificationStatusEnum.SENT)
    ).toBe(true);
    expect(notifications.map((n) => n.sentToEmail).sort()).toEqual(
      [pilote1.email, pilote2.email].sort()
    );
  });

  test('ignore les notifications qui ne sont pas en statut pending', async () => {
    // Crée une notification déjà envoyée et une autre en échec
    await createTestData({ status: NotificationStatusEnum.SENT });
    // Crée une notification
    await createTestData({ status: NotificationStatusEnum.FAILED });

    // Configure le mock
    mockEmailService.sendEmail.mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    });

    // Envoie les notifications
    await notificationsService.sendPendingNotifications();

    // Vérifie qu'aucun email n'a été envoyé
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
  });
});
