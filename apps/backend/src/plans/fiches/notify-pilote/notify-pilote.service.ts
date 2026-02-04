import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { UserPreferencesService } from '@tet/backend/users/preferences/user-preferences.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { Result } from '@tet/backend/utils/result.type';
import { PersonneTagOrUserWithContacts } from '@tet/domain/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  Notification,
  NotificationInsert,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { differenceBy, isNil } from 'es-toolkit';
import { DateTime, DurationLike } from 'luxon';
import { DatabaseError } from 'pg';
import { z } from 'zod';
import GetPlanUrlService from '../../utils/get-plan-url.service';
import { NotifyPiloteMultiFichesEmail } from './notify-pilote-multi-fiches.email';
import { NotifyPiloteMultiFichesProps } from './notify-pilote-multi-fiches.props';
import { NotifyPiloteEmail } from './notify-pilote.email';
import { NotifyPiloteProps } from './notify-pilote.props';

export type UserWithEmail = Omit<
  PersonneTagOrUserWithContacts,
  'userId' | 'email'
> & {
  userId: string;
  email: string;
};
type UpsertNotificationsResult = Result<
  // nombre de notifications insérées
  { count: number },
  string
>;

/** Format des données pour le champ `notificationData`  */
const onUpdateFichePiloteNotificationDataSchema = z.object({
  ficheIds: z.array(z.number()),
  piloteId: z.uuid(),
});
type OnUpdateFichePiloteNotificationData = z.infer<
  typeof onUpdateFichePiloteNotificationDataSchema
>;
type OnUpdateFichePiloteNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: OnUpdateFichePiloteNotificationData;
};

const DEFAULT_DELAY_BEFORE_SENDING: DurationLike = { minutes: 15 };

@Injectable()
export class NotifyPiloteService {
  private readonly logger = new Logger(NotifyPiloteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listFichesService: ListFichesService,
    private readonly listUsersService: ListUsersService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly notificationsService: NotificationsService,
    private readonly getPlanUrlService: GetPlanUrlService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      (notification: Notification) =>
        this.getPiloteNotificationContent(notification)
    );
  }

  /**
   * Insère/met à jour la notification à envoyer aux pilotes nouvellement
   * affectés à la fiche (appelée lors de l'update de la fiche)
   */
  async upsertPiloteNotifications({
    updatedFiche,
    previousFiche,
    user,
    tx,
  }: {
    updatedFiche: FicheWithRelations;
    previousFiche: FicheWithRelations;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<UpsertNotificationsResult> {
    if (user.id === null) {
      return { success: false, error: 'User Id non valide' };
    }
    const userId = user.id;
    const pilotes = this.getNewlyAssignedPilotes(
      updatedFiche,
      previousFiche,
      userId
    );
    const ficheId = updatedFiche.id;
    let insertedCount = 0;

    const executeInTransaction = async (transaction: Transaction) => {
      // récupère les IDs des pilotes actuels
      const currentPiloteUserIds =
        updatedFiche.pilotes
          ?.filter((p) => p.userId)
          .map((p) => p.userId as string) ?? [];

      // récupère toutes les notifications pending pour cette fiche
      const allPendingNotificationsForFiche = await transaction
        .select()
        .from(notificationTable)
        .where(
          and(
            eq(notificationTable.status, NotificationStatusEnum.PENDING),
            eq(
              notificationTable.notifiedOn,
              NotifiedOnEnum.UPDATE_FICHE_PILOTE
            ),
            sql`${notificationTable.notificationData}->'ficheIds' @> '${sql.raw(
              JSON.stringify([ficheId])
            )}'::jsonb`
          )
        );

      // nettoie les notifications pour les pilotes qui ne sont plus assignés
      await this.cleanupNotificationsForRemovedPilotes(
        transaction,
        ficheId,
        currentPiloteUserIds,
        allPendingNotificationsForFiche
      );

      if (!pilotes.length) {
        return;
      }

      // récupère les notifications existantes pour les nouveaux pilotes
      const userIds = pilotes.map((p) => p.userId);
      const existingNotificationsByUserId =
        await this.getExistingNotificationsForPilotes(transaction, userIds);

      // calcule la date d'envoi
      const sendAfter = this.calculateSendAfterDate();

      // met à jour ou crée les notifications pour les nouveaux pilotes
      const result = await this.updateOrCreateNotificationsForPilotes(
        transaction,
        pilotes,
        ficheId,
        user,
        existingNotificationsByUserId,
        sendAfter
      );

      insertedCount = result.insertedCount;
    };

    try {
      // Utilise la transaction fournie ou en crée une nouvelle
      await (tx
        ? executeInTransaction(tx)
        : this.databaseService.db.transaction(async (newTx) =>
            executeInTransaction(newTx)
          ));
    } catch (error) {
      this.logger.log(
        `upsertPiloteNotifications error: ${JSON.stringify(error)}`
      );
      return { success: false, error: (error as DatabaseError).message };
    }

    return {
      success: true,
      data: { count: insertedCount },
    };
  }

  /**
   * Nettoie les notifications pour les pilotes qui ne sont plus assignés à la fiche
   */
  private async cleanupNotificationsForRemovedPilotes(
    transaction: Transaction,
    ficheId: number,
    currentPiloteUserIds: string[],
    allPendingNotificationsForFiche: Notification[]
  ): Promise<void> {
    // détermine les notifications à traiter
    const notificationsToProcess =
      currentPiloteUserIds.length > 0
        ? // filtre les notifications pour les utilisateurs qui ne sont plus pilotes
          allPendingNotificationsForFiche.filter(
            (n) => !currentPiloteUserIds.includes(n.sendTo)
          )
        : // si aucun pilote avec userId, traite toutes les notifications
          allPendingNotificationsForFiche;

    // traite chaque notification
    for (const notification of notificationsToProcess) {
      const notificationData = notification.notificationData as {
        ficheIds: number[];
        piloteId: string;
      };
      const updatedFicheIds = notificationData.ficheIds.filter(
        (id) => id !== ficheId
      );

      if (updatedFicheIds.length === 0) {
        // supprime la notification si plus aucune fiche
        await transaction
          .delete(notificationTable)
          .where(eq(notificationTable.id, notification.id));
      } else {
        // met à jour la notification en retirant ce ficheId
        await transaction
          .update(notificationTable)
          .set({
            notificationData: {
              ficheIds: updatedFicheIds,
              piloteId: notificationData.piloteId,
            },
          })
          .where(eq(notificationTable.id, notification.id));
      }
    }
  }

  /**
   * Récupère les notifications existantes pour les pilotes donnés
   */
  private async getExistingNotificationsForPilotes(
    transaction: Transaction,
    piloteUserIds: string[]
  ): Promise<Map<string, Notification>> {
    const existingNotifications = await transaction
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.status, NotificationStatusEnum.PENDING),
          eq(notificationTable.notifiedOn, NotifiedOnEnum.UPDATE_FICHE_PILOTE),
          inArray(notificationTable.sendTo, piloteUserIds)
        )
      );

    return new Map(existingNotifications.map((n) => [n.sendTo, n]));
  }

  /**
   * Calcule la date d'envoi de la notification
   */
  private calculateSendAfterDate(): string {
    return DateTime.now().plus(DEFAULT_DELAY_BEFORE_SENDING).toUTC().toString();
  }

  /**
   * Met à jour ou crée les notifications pour les pilotes nouvellement assignés
   */
  private async updateOrCreateNotificationsForPilotes(
    transaction: Transaction,
    pilotes: UserWithEmail[],
    ficheId: number,
    user: AuthenticatedUser,
    existingNotificationsByUserId: Map<string, Notification>,
    sendAfter: string
  ): Promise<{ insertedCount: number }> {
    let insertedCount = 0;

    for (const pilote of pilotes) {
      const existingNotification = existingNotificationsByUserId.get(
        pilote.userId
      );

      if (existingNotification) {
        // met à jour la notification existante
        const notificationData = existingNotification.notificationData as {
          ficheIds: number[];
          piloteId: string;
        };
        const ficheIds = [...new Set([...notificationData.ficheIds, ficheId])]; // évite les doublons

        await transaction
          .update(notificationTable)
          .set({
            notificationData: {
              ficheIds,
              piloteId: pilote.userId,
            },
            sendAfter,
          })
          .where(eq(notificationTable.id, existingNotification.id));
      } else {
        // crée une nouvelle notification
        const notificationsToInsert: OnUpdateFichePiloteNotificationInsert[] = [
          {
            createdBy: user.id,
            status: NotificationStatusEnum.PENDING,
            sendTo: pilote.userId,
            notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
            notificationData: {
              ficheIds: [ficheId],
              piloteId: pilote.userId,
            },
          },
        ];

        await this.notificationsService.createPendingNotifications(
          notificationsToInsert,
          DEFAULT_DELAY_BEFORE_SENDING,
          transaction
        );

        insertedCount++;
      }
    }

    return { insertedCount };
  }

  /**
   * Donne, en excluant l'auto-assignation, les pilotes nouvellement assignés et
   * ayant un email
   */
  private getNewlyAssignedPilotes(
    updatedFiche: FicheWithRelations,
    previousFiche: FicheWithRelations,
    userId: string
  ): UserWithEmail[] {
    const withEmailAndNotAutoAssigned = (p: PersonneTagOrUserWithContacts) =>
      !isNil(p.email) && !isNil(p.userId) && p.userId !== userId;

    const pilotesWithEmailIntoUpdatedFiche = updatedFiche.pilotes?.filter(
      withEmailAndNotAutoAssigned
    ) as UserWithEmail[];
    if (!pilotesWithEmailIntoUpdatedFiche?.length) return [];

    const pilotesWithEmailIntoPreviousFiche = previousFiche.pilotes?.filter(
      withEmailAndNotAutoAssigned
    ) as UserWithEmail[];
    if (!pilotesWithEmailIntoPreviousFiche?.length)
      return pilotesWithEmailIntoUpdatedFiche;

    // pilotes présents dans la fiche màj et qui ne l'étaient pas dans la version précédente
    return differenceBy(
      pilotesWithEmailIntoUpdatedFiche,
      pilotesWithEmailIntoPreviousFiche,
      (p) => p.email
    );
  }

  /**
   * Charge les données et génère le contenu de la notification
   * (appelée lors de l'envoi des notifications)
   */
  async getPiloteNotificationContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    // charge les données
    const ret = await this.getPiloteNotificationTemplateData(notification);
    if (!ret.success) {
      this.logger.log(`getPiloteNotificationTemplate error: ${ret.error}`);
      return ret;
    }

    const templateData = ret.data;
    const { sendToEmail, subject } = templateData;

    // utilise le template approprié selon le nombre de fiches
    const isMultiFiches =
      'assignedActions' in templateData &&
      templateData.assignedActions.length > 1;
    const content = isMultiFiches
      ? NotifyPiloteMultiFichesEmail(
          templateData as NotifyPiloteMultiFichesProps
        )
      : NotifyPiloteEmail(templateData as NotifyPiloteProps);

    return {
      success: true,
      data: {
        sendToEmail,
        subject,
        content,
      },
    };
  }

  /**
   * Prépare les données nécessaires à l'envoi de la notification aux pilotes
   * nouvellement affectés à la fiche
   */
  private async getPiloteNotificationTemplateData(
    notification: Notification
  ): Promise<Result<NotifyPiloteProps | NotifyPiloteMultiFichesProps, string>> {
    const { createdBy, notificationData } = notification;
    const { data, success, error } =
      onUpdateFichePiloteNotificationDataSchema.safeParse(notificationData);
    if (!success) {
      return { success: false, error: error.message };
    }
    if (!createdBy) {
      return {
        success: false,
        error: "Auteur de l'assignation du pilote non identifié",
      };
    }
    const { ficheIds, piloteId } = data;

    // vérifie si l'envoi des notifications au pilote est totalement désactivé
    // depuis les préférences utilisateur
    const resultPreferences =
      await this.userPreferencesService.getUserPreferences(piloteId);
    if (!resultPreferences.success || !resultPreferences.data) {
      return {
        success: false,
        error: 'Erreur de chargement des préférences utilisateur',
      };
    }
    const preferences = resultPreferences.data;
    const { isNotifyPiloteActionEnabled, isNotifyPiloteSousActionEnabled } =
      preferences.utils.notifications;
    if (!isNotifyPiloteActionEnabled && !isNotifyPiloteSousActionEnabled) {
      return {
        success: false,
        error: `Notification pilote désactivée globalement pour l'utilisateur "${piloteId}"`,
      };
    }

    // charge toutes les fiches
    const fiches: FicheWithRelations[] = [];
    const result = await this.listFichesService.listFichesQuery(
      null,
      { ficheIds, withChildren: true },
      { limit: 'all' }
    );
    for (const ficheId of ficheIds) {
      const fiche = result.data.find((f) => f.id === ficheId);
      if (!fiche) {
        this.logger.log(`Action ${ficheId} non trouvée`);
      } else if (
        (!fiche.parentId && !isNotifyPiloteActionEnabled) ||
        (fiche.parentId && !isNotifyPiloteSousActionEnabled)
      ) {
        this.logger.log(
          `Notification pilote désactivée pour l'utilisateur "${piloteId}" l'action ${ficheId} non trouvée`
        );
      } else {
        fiches.push(fiche);
      }
    }

    if (!fiches.length) {
      return {
        success: false,
        error: `Echec de préparation des données pour notifier le pilote ${piloteId} des fiches ${ficheIds}`,
      };
    }

    const createdByUser = await this.listUsersService.getUserBasicInfo({
      userId: createdBy,
    });
    if (!createdByUser) {
      return {
        success: false,
        error: "Auteur de l'assignation du pilote non trouvé",
      };
    }
    const pilote = await this.listUsersService.getUserBasicInfo({
      userId: piloteId,
    });
    if (!pilote) {
      return { success: false, error: 'Pilote non trouvé' };
    }

    // si une seule fiche, utilise le format simple
    if (fiches.length === 1) {
      const fiche = fiches[0];
      let ficheParente;
      if (fiche.parentId) {
        const getParentResult = await this.listFichesService.getFicheById(
          fiche.parentId
        );
        if (!getParentResult.success) {
          return { success: false, error: 'Action parente non trouvée' };
        }
        ficheParente = getParentResult.data;
      }

      return {
        success: true,
        data: {
          sendToEmail: pilote.email,
          subject: `Vous avez été assigné(e) à une ${
            fiche.parentId ? 'sous-' : ''
          }action sur Territoires en Transitions`,
          assignedTo: pilote.nom,
          assignedBy: [createdByUser.prenom, createdByUser.nom].join(' '),
          assignedAction: this.getAssignedActionData(fiche, ficheParente),
        },
      };
    }

    // plusieurs fiches : charge les fiches parentes (pour les sous-actions)
    const parentFicheIds = new Set<number>();
    fiches.forEach((f) => {
      if (f.parentId) {
        parentFicheIds.add(f.parentId);
      }
    });
    let parentFiches: FicheWithRelations[] = [];
    if (parentFicheIds.size) {
      const getParentsResult = await this.listFichesService.listFichesQuery(
        null,
        { ficheIds: Array.from(parentFicheIds) },
        { limit: 'all' }
      );
      parentFiches = getParentsResult.data;
    }
    // et utilise le format multi-fiches
    const assignedActions = fiches.map((fiche) => {
      const parentFiche = fiche.parentId
        ? parentFiches.find((pf) => pf.id === fiche.parentId)
        : undefined;
      return this.getAssignedActionData(fiche, parentFiche);
    });

    return {
      success: true,
      data: {
        sendToEmail: pilote.email,
        subject:
          'Vous avez été assigné(e) à plusieurs actions sur Territoires en Transitions',
        assignedTo: pilote.nom,
        assignedActions,
      },
    };
  }

  getAssignedActionData(
    fiche: FicheWithRelations,
    ficheParente?: FicheWithRelations
  ) {
    const plan = fiche.plans?.[0];
    return {
      actionTitre: ficheParente ? ficheParente.titre : fiche.titre,
      sousActionTitre: ficheParente ? fiche.titre : '',
      planNom: plan?.nom || null,
      actionDateFin: fiche.dateFin,
      isSousAction: !!fiche.parentId,
      actionUrl: this.getPlanUrlService.getFicheUrl({
        collectiviteId: fiche.collectiviteId,
        ficheId: fiche.id,
        parentId: fiche.parentId,
        planId: plan?.id || null,
      }),
    };
  }
}
