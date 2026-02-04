import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { UserPreferencesService } from '@tet/backend/users/preferences/user-preferences.service';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { NotificationStatusEnum, NotifiedOnEnum } from '@tet/domain/utils';
import { eq, inArray, sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createFiche } from '../fiches.test-fixture';
import ListFichesService from '../list-fiches/list-fiches.service';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { NotifyPiloteService } from './notify-pilote.service';

describe("Notifications envoyées lors de la mise à jour d'une fiche action", () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let notifyPiloteService: NotifyPiloteService;
  let listFichesService: ListFichesService;
  let userPreferencesService: UserPreferencesService;
  let testCollectiviteAndUserCleanup: () => Promise<void>;

  const testUsers: Array<{ userId: string; cleanup: () => Promise<void> }> = [];
  const testFicheIds: number[] = [];

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = await app.get(TrpcRouter);
    notifyPiloteService = app.get(NotifyPiloteService);
    listFichesService = app.get(ListFichesService);
    userPreferencesService = app.get(UserPreferencesService);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          accessLevel: CollectiviteRole.EDITION,
        },
      }
    );

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);
    testCollectiviteAndUserCleanup = testCollectiviteAndUserResult.cleanup;

    return async () => {
      await testCollectiviteAndUserCleanup();
      await app.close();
    };
  });

  afterEach(async () => {
    // Nettoyer les notifications associées aux utilisateurs de test
    for (const user of testUsers) {
      await databaseService.db
        .delete(notificationTable)
        .where(eq(notificationTable.sendTo, user.userId));
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
      collectiviteId: collectivite.id,
    });

    testUsers.push({ userId: user.id, cleanup });
    return user;
  }

  /**
   * Obtient une fiche avec ses relations (pilotes)
   */
  async function getFicheWithRelations(ficheId: number) {
    const fiche = await listFichesService.getFicheById(
      ficheId,
      false,
      editorUser
    );
    if (!fiche.success) {
      throw new Error(`Fiche ${ficheId} not found`);
    }
    return fiche.data;
  }

  /**
   * Vérifie les notifications dans la base pour une fiche
   */
  async function getNotificationsForFiche(ficheId: number) {
    return await databaseService.db
      .select()
      .from(notificationTable)
      .where(
        sql`${notificationTable.notificationData}->'ficheIds' @> '${sql.raw(
          JSON.stringify([ficheId])
        )}'::jsonb`
      );
  }

  /**
   * Vérifie les notifications dans la base pour un utilisateur
   */
  async function getNotificationsForUser(userId: string) {
    return await databaseService.db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.sendTo, userId));
  }

  test('insère des notifications pour les nouveaux pilotes', async () => {
    const caller = router.createCaller({ user: editorUser });

    // crée des utilisateurs de test
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // crée une fiche
    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId);

    // ajoute des pilotes à la fiche
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }, { userId: user2.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications ont été créées automatiquement par update-fiche
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: null,
          status: NotificationStatusEnum.PENDING,
          sendTo: user1.id,
          sentAt: null,
          sentToEmail: null,
          errorMessage: null,
          createdBy: editorUser.id,
          createdAt: expect.any(String),
          notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
          notificationData: { ficheIds: [ficheId], piloteId: user1.id },
        }),
        expect.objectContaining({
          entityId: null,
          status: NotificationStatusEnum.PENDING,
          sendTo: user2.id,
          sentAt: null,
          sentToEmail: null,
          errorMessage: null,
          createdBy: editorUser.id,
          createdAt: expect.any(String),
          notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
          notificationData: { ficheIds: [ficheId], piloteId: user2.id },
        }),
      ])
    );
  });

  test('ne crée pas de doublons si les notifications existent déjà', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // crée une fiche et attache des pilotes
    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId);
    const previousFiche = await getFicheWithRelations(ficheId);
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }, { userId: user2.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications ont été créées automatiquement par plans.fiches.update
    let notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);

    // Deuxième appel avec la même fiche - ne doit pas créer de doublons
    const updatedFiche = await getFicheWithRelations(ficheId);
    const result2 = await notifyPiloteService.upsertPiloteNotifications({
      updatedFiche,
      previousFiche,
      user: editorUser,
    });

    assert(result2.success);
    expect(result2.data?.count).toBe(0); // Aucune nouvelle notification car elles existent déjà

    // vérifie qu'il n'y a toujours que 2 notifications
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
  });

  test('supprime les notifications pending pour les pilotes qui ne sont plus assignés', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId);

    // ajoute user1 et user2 comme pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }, { userId: user2.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications existent
    let notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);

    // ajoute manuellement une notification pour user3 (qui ne sera plus assigné)
    await databaseService.db.insert(notificationTable).values({
      sendTo: user3.id,
      status: NotificationStatusEnum.PENDING,
      notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      notificationData: { ficheIds: [ficheId], piloteId: user3.id },
    });

    // retire user2 et user3, garde seulement user1
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications pour user2 et user3 ont été supprimées
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].sendTo).toBe(user1.id);
  });

  test('supprime toutes les notifications pending si plus aucun pilote affecté', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId);

    // ajoute des pilotes
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }, { userId: user2.id }],
      },
      isNotificationEnabled: true,
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

    // vérifie que toutes les notifications ont été supprimées
    notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(0);
  });

  test('gère correctement l’ajout de nouveaux pilotes après suppression', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const user3 = await createTestUser();

    const ficheId = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId);

    // ajoute user1 comme pilote
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    // retire user1 et ajoute user2 et user3
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        pilotes: [{ userId: user2.id }, { userId: user3.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie que les notifications pour user2 et user3 ont été créées
    const notifications = await getNotificationsForFiche(ficheId);
    expect(notifications).toHaveLength(2);
    expect(notifications.map((n) => n.sendTo).sort()).toEqual(
      [user2.id, user3.id].sort()
    );
  });

  test('met à jour une notification existante au lieu d’en créer une nouvelle', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();

    // crée deux fiches
    const ficheId1 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId1);

    const ficheId2 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId2);

    // assigne user1 à fiche1
    await caller.plans.fiches.update({
      ficheId: ficheId1,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie qu'une notification existe pour user1 avec fiche1
    let notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].notificationData).toEqual({
      ficheIds: [ficheId1],
      piloteId: user1.id,
    });
    expect(notifications[0].entityId).toBeNull();

    // assigne user1 à fiche2
    await caller.plans.fiches.update({
      ficheId: ficheId2,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    // vérifie qu'une seule notification existe toujours pour user1 avec les deux fiches
    notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].notificationData).toEqual({
      ficheIds: expect.arrayContaining([ficheId1, ficheId2]),
      piloteId: user1.id,
    });
    expect(notifications[0].entityId).toBeNull();
  });

  test('regroupe plusieurs fiches dans une seule notification', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();

    // crée trois fiches
    const ficheId1 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId1);

    const ficheId2 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId2);

    const ficheId3 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId3);

    // assigne user1 à fiche1 → notification créée
    await caller.plans.fiches.update({
      ficheId: ficheId1,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    let notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].notificationData).toEqual({
      ficheIds: [ficheId1],
      piloteId: user1.id,
    });

    // assigne user1 à fiche2 → notification mise à jour avec [fiche1, fiche2]
    await caller.plans.fiches.update({
      ficheId: ficheId2,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].notificationData).toEqual({
      ficheIds: expect.arrayContaining([ficheId1, ficheId2]),
      piloteId: user1.id,
    });

    // assigne user1 à fiche3 → notification mise à jour avec [fiche1, fiche2, fiche3]
    await caller.plans.fiches.update({
      ficheId: ficheId3,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].notificationData).toEqual({
      ficheIds: expect.arrayContaining([ficheId1, ficheId2, ficheId3]),
      piloteId: user1.id,
    });
  });

  test('génère le contenu multi-fiches avec le bon template', async () => {
    const caller = router.createCaller({ user: editorUser });

    const user1 = await createTestUser();

    // crée deux fiches
    const ficheId1 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId1);

    const ficheId2 = await createFiche({
      caller,
      ficheInput: { collectiviteId: collectivite.id },
    });
    testFicheIds.push(ficheId2);

    // assigne user1 aux deux fiches
    await caller.plans.fiches.update({
      ficheId: ficheId1,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    await caller.plans.fiches.update({
      ficheId: ficheId2,
      ficheFields: {
        pilotes: [{ userId: user1.id }],
      },
      isNotificationEnabled: true,
    });

    // récupère la notification
    const notifications = await getNotificationsForUser(user1.id);
    expect(notifications).toHaveLength(1);
    const notification = notifications[0];

    // vérifie que getPiloteNotificationContent génère le bon template
    const contentResult =
      await notifyPiloteService.getPiloteNotificationContent(notification);
    expect(contentResult.success).toBe(true);
    if (contentResult.success) {
      expect(contentResult.data.subject).toBe(
        'Vous avez été assigné(e) à plusieurs actions sur Territoires en Transitions'
      );
      // vérifie que le contenu contient les deux fiches (via le template multi-fiches)
      expect(contentResult.data.content).toBeDefined();
    }
  });

  describe('Incidence des préférences utilisateur', () => {
    test('filtre les actions lors de la génération du contenu si isNotifyPiloteActionEnabled est désactivé', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // crée une fiche (action, pas de parentId) et assigne user1 comme pilote
      const ficheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(ficheId);

      await caller.plans.fiches.update({
        ficheId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);

      // désactive les notifications pour les actions
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: false,
            isNotifyPiloteSousActionEnabled: true,
          },
        },
      });

      // vérifie que getPiloteNotificationContent retourne une erreur car toutes les fiches sont filtrées
      const contentResult =
        await notifyPiloteService.getPiloteNotificationContent(
          notifications[0]
        );
      expect(contentResult.success).toBe(false);
      if (!contentResult.success) {
        expect(contentResult.error).toContain(
          'Echec de préparation des données'
        );
      }
    });

    test('filtre les sous-actions lors de la génération du contenu si isNotifyPiloteSousActionEnabled est désactivé', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // crée une fiche parente
      const parentFicheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(parentFicheId);

      // crée une sous-action (fiche avec parentId)
      const sousActionId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(sousActionId);

      // définit la sous-action avec parentId
      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          parentId: parentFicheId,
        },
        isNotificationEnabled: false, // pas de notification lors de la création du parentId
      });

      // assigne user1 comme pilote de la sous-action
      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);

      // désactive les notifications pour les sous-actions
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: true,
            isNotifyPiloteSousActionEnabled: false,
          },
        },
      });

      // vérifie que getPiloteNotificationContent retourne une erreur car toutes les fiches sont filtrées
      const contentResult =
        await notifyPiloteService.getPiloteNotificationContent(
          notifications[0]
        );
      expect(contentResult.success).toBe(false);
      if (!contentResult.success) {
        expect(contentResult.error).toContain(
          'Echec de préparation des données'
        );
      }
    });

    test('retourne une erreur lors de la génération du contenu si les deux préférences sont désactivées', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // crée une fiche (action) et assigne user1 comme pilote
      const ficheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(ficheId);

      await caller.plans.fiches.update({
        ficheId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);

      // désactive toutes les notifications
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: false,
            isNotifyPiloteSousActionEnabled: false,
          },
        },
      });

      // vérifie que getPiloteNotificationContent retourne une erreur
      const contentResult =
        await notifyPiloteService.getPiloteNotificationContent(
          notifications[0]
        );
      expect(contentResult.success).toBe(false);
      if (!contentResult.success) {
        expect(contentResult.error).toContain(
          'Notification pilote désactivée globalement'
        );
      }
    });

    test('getPiloteNotificationContent retourne une erreur si les préférences désactivent toutes les notifications', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // crée une fiche et assigne user1 comme pilote (notification créée)
      const ficheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(ficheId);

      await caller.plans.fiches.update({
        ficheId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);

      // désactive toutes les notifications après la création
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: false,
            isNotifyPiloteSousActionEnabled: false,
          },
        },
      });

      // vérifie que getPiloteNotificationContent retourne une erreur
      const contentResult =
        await notifyPiloteService.getPiloteNotificationContent(
          notifications[0]
        );
      expect(contentResult.success).toBe(false);
      if (!contentResult.success) {
        expect(contentResult.error).toContain(
          'Notification pilote désactivée globalement'
        );
      }
    });

    test('filtre les fiches selon les préférences lors de la génération du contenu', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // crée une action et une sous-action
      const actionId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(actionId);

      const parentFicheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(parentFicheId);

      const sousActionId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(sousActionId);

      // définit la sous-action
      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          parentId: parentFicheId,
        },
        isNotificationEnabled: false,
      });

      // assigne user1 à l'action et à la sous-action
      await caller.plans.fiches.update({
        ficheId: actionId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée avec les deux fiches
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].notificationData).toEqual({
        ficheIds: expect.arrayContaining([actionId, sousActionId]),
        piloteId: user1.id,
      });

      // désactive uniquement les notifications pour les sous-actions
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: true,
            isNotifyPiloteSousActionEnabled: false,
          },
        },
      });

      // vérifie que getPiloteNotificationContent filtre la sous-action
      const contentResult =
        await notifyPiloteService.getPiloteNotificationContent(
          notifications[0]
        );
      expect(contentResult.success).toBe(true);
      if (contentResult.success) {
        // vérifie que le sujet correspond à une seule action (pas "plusieurs actions")
        expect(contentResult.data.subject).toBe(
          'Vous avez été assigné(e) à une action sur Territoires en Transitions'
        );
        // vérifie que le contenu ne mentionne que l'action, pas la sous-action
        expect(contentResult.data.content).toBeDefined();
        expect(contentResult.data.content).not.toContain('sous-action');
      }
    });

    test('crée une notification pour une action même si les sous-actions sont désactivées', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // désactive uniquement les notifications pour les sous-actions
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: true,
            isNotifyPiloteSousActionEnabled: false,
          },
        },
      });

      // crée une fiche (action, pas de parentId)
      const ficheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(ficheId);

      // assigne user1 comme pilote
      await caller.plans.fiches.update({
        ficheId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].notificationData).toEqual({
        ficheIds: [ficheId],
        piloteId: user1.id,
      });
    });

    test('crée une notification pour une sous-action même si les actions sont désactivées', async () => {
      const caller = router.createCaller({ user: editorUser });

      const user1 = await createTestUser();
      const user1Auth = getAuthUserFromDcp(user1);

      // désactive uniquement les notifications pour les actions
      await userPreferencesService.updateUserPreferences(user1Auth, {
        utils: {
          notifications: {
            isNotifyPiloteActionEnabled: false,
            isNotifyPiloteSousActionEnabled: true,
          },
        },
      });

      // crée une fiche parente
      const parentFicheId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(parentFicheId);

      // crée une sous-action
      const sousActionId = await createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id },
      });
      testFicheIds.push(sousActionId);

      // définit la sous-action avec parentId
      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          parentId: parentFicheId,
        },
        isNotificationEnabled: false,
      });

      // assigne user1 comme pilote de la sous-action
      await caller.plans.fiches.update({
        ficheId: sousActionId,
        ficheFields: {
          pilotes: [{ userId: user1.id }],
        },
        isNotificationEnabled: true,
      });

      // vérifie qu'une notification a été créée
      const notifications = await getNotificationsForUser(user1.id);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].notificationData).toEqual({
        ficheIds: [sousActionId],
        piloteId: user1.id,
      });
    });
  });
});
