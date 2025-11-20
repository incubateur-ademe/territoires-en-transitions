import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { addTestUser } from '@/backend/users/users/users.fixture';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { NotificationStatusEnum } from '@/backend/utils/notifications/models/notification-status.enum';
import { notificationTable } from '@/backend/utils/notifications/models/notification.table';
import { NotifiedOnEnum } from '@/backend/utils/notifications/models/notified-on.enum';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { eq, inArray } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createFiche } from '../fiches.test-fixture';
import ListFichesService from '../list-fiches/list-fiches.service';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { NotifyPiloteService } from './notify-pilote.service';

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.edition;

describe("Notifications envoyées lors de la mise à jour d'une fiche action", () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;
  let notifyPiloteService: NotifyPiloteService;
  let listFichesService: ListFichesService;

  const testUsers: Array<{ userId: string; cleanup: () => Promise<void> }> = [];
  const testFicheIds: number[] = [];

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = await app.get(TrpcRouter);
    yoloDodo = await getAuthUser();
    notifyPiloteService = app.get(NotifyPiloteService);
    listFichesService = app.get(ListFichesService);

    return async () => {
      await app.close();
    };
  });

  afterEach(async () => {
    // Nettoyer les notifications de test
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
   * Obtient une fiche avec ses relations (pilotes)
   */
  async function getFicheWithRelations(ficheId: number) {
    const fiche = await listFichesService.getFicheById(
      ficheId,
      false,
      yoloDodo
    );
    if (!fiche) {
      throw new Error(`Fiche ${ficheId} not found`);
    }
    return fiche;
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

  test('insère des notifications pour les nouveaux pilotes', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // crée des utilisateurs de test
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // crée une fiche
    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: COLLECTIVITE_ID },
    });
    testFicheIds.push(ficheId);

    // ajoute des pilotes à la fiche
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }, { userId: user2.userId }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications ont été créées automatiquement par update-fiche
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: String(ficheId),
          status: NotificationStatusEnum.PENDING,
          sendTo: user1.userId,
          sentAt: null,
          sentToEmail: null,
          errorMessage: null,
          createdBy: yoloDodo.id,
          createdAt: expect.any(String),
          notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
          notificationData: { ficheId, piloteId: user1.userId },
        }),
        expect.objectContaining({
          entityId: String(ficheId),
          status: NotificationStatusEnum.PENDING,
          sendTo: user2.userId,
          sentAt: null,
          sentToEmail: null,
          errorMessage: null,
          createdBy: yoloDodo.id,
          createdAt: expect.any(String),
          notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
          notificationData: { ficheId, piloteId: user2.userId },
        }),
      ])
    );
  });

  test('ne crée pas de doublons si les notifications existent déjà', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: COLLECTIVITE_ID },
    });
    testFicheIds.push(ficheId);
    const previousFiche = await getFicheWithRelations(ficheId);

    // ajoute des pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }, { userId: user2.userId }],
      },
      isNotificationEnabled: true,
    });

    const updatedFiche = await getFicheWithRelations(ficheId);

    // vérifie que les notifications ont été créées automatiquement par update-fiche
    let notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);

    // Deuxième appel avec la même fiche - ne doit pas créer de doublons
    const result2 = await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche,
      previousFiche,
      user: yoloDodo,
    });

    assert(result2.success);
    expect(result2.data?.count).toBe(0); // Aucune nouvelle notification car elles existent déjà

    // vérifie qu'il n'y a toujours que 2 notifications
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
  });

  test('supprime les notifications pending pour les pilotes qui ne sont plus assignés', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: COLLECTIVITE_ID },
    });
    testFicheIds.push(ficheId);
    const previousFiche = await getFicheWithRelations(ficheId);

    // ajoute user1 et user2 comme pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }, { userId: user2.userId }],
      },
      isNotificationEnabled: true,
    });

    const updatedFiche1 = await getFicheWithRelations(ficheId);

    // crée des notifications pour user1 et user2
    await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche: updatedFiche1,
      previousFiche,
      user: yoloDodo,
    });

    // vérifie que les notifications existent
    let notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);

    // ajoute manuellement une notification pour user3 (qui ne sera plus assigné)
    await databaseService.db.insert(notificationTable).values({
      entityId: String(ficheId),
      sendTo: user3.userId,
      status: NotificationStatusEnum.PENDING,
      notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      notificationData: { ficheId, piloteId: user3.userId },
    });

    // retire user2 et user3, garde seulement user1
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }],
      },
      isNotificationEnabled: true,
    });

    const updatedFiche2 = await getFicheWithRelations(ficheId);

    // màj les notifications
    await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche: updatedFiche2,
      previousFiche: updatedFiche1,
      user: yoloDodo,
    });

    // vérifie que les notifications pour user2 et user3 ont été supprimées
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].sendTo).toBe(user1.userId);
  });

  test('supprime toutes les notifications pending si plus aucun pilote affecté', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: COLLECTIVITE_ID },
    });
    testFicheIds.push(ficheId);
    const previousFiche = await getFicheWithRelations(ficheId);

    // ajoute des pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }, { userId: user2.userId }],
      },
      isNotificationEnabled: true,
    });

    const updatedFiche1 = await getFicheWithRelations(ficheId);

    // crée des notifications
    await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche: updatedFiche1,
      previousFiche,
      user: yoloDodo,
    });

    // vérifie que les notifications existent
    let notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);

    // retire tous les pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [],
      },
      isNotificationEnabled: true,
    });

    const updatedFiche2 = await getFicheWithRelations(ficheId);

    // màj les notifications
    await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche: updatedFiche2,
      previousFiche: updatedFiche1,
      user: yoloDodo,
    });

    // vérifie que toutes les notifications ont été supprimées
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(0);
  });

  test('gère correctement l’ajout de nouveaux pilotes après suppression', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: COLLECTIVITE_ID },
    });
    testFicheIds.push(ficheId);

    // ajoute user1 comme pilote
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.userId }],
      },
      isNotificationEnabled: true,
    });

    const previousFiche1 = await getFicheWithRelations(ficheId);
    const updatedFiche1 = await getFicheWithRelations(ficheId);

    // crée une notification pour user1
    await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche: updatedFiche1,
      previousFiche: previousFiche1,
      user: yoloDodo,
    });

    // retire user1 et ajoute user2 et user3
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user2.userId }, { userId: user3.userId }],
      },
      isNotificationEnabled: true,
    });

    // et que les notifications pour user2 et user3 ont été créées
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.sendTo).sort()).toEqual(
      [user2.userId, user3.userId].sort()
    );
  });
});
