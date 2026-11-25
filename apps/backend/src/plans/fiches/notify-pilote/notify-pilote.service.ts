import { Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
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
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { differenceBy, isNil } from 'es-toolkit';
import { DateTime, DurationLike } from 'luxon';
import { DatabaseError } from 'pg';
import {
  onUpdateFichePiloteNotificationDataSchema,
  OnUpdateFichePiloteNotificationData,
} from './notify-pilote-notification-data.schema';

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

type OnUpdateFichePiloteNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: OnUpdateFichePiloteNotificationData;
};

@Injectable()
export class NotifyPiloteService {
  private readonly logger = new Logger(NotifyPiloteService.name);

  constructor(
    private readonly configService: ConfigurationService,
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService
  ) {}

  getDelayBeforeSendingNotification(): DurationLike {
    return {
      minutes: this.configService.get('DELAY_IN_MIN_BEFORE_NOTIFY_PILOTE'),
    };
  }

  /**
   * Insère/met à jour les notifications à envoyer aux pilotes
   */
  async upsertPiloteNotificationsBulk({
    fichesPairs,
    user,
    tx,
  }: {
    fichesPairs: Array<{
      previousFiche: FicheWithRelations;
      updatedFiche: FicheWithRelations;
    }>;
    user: AuthUser;
    tx?: Transaction;
  }): Promise<UpsertNotificationsResult> {
    if (user.id === null) {
      return { success: false, error: 'User Id non valide' };
    }
    const userId = user.id;
    let insertedCount = 0;

    const executeInTransaction = async (transaction: Transaction) => {
      const { pilotesByUserId, fichesToCleanup } =
        this.getPilotesByUserIdAndFichesToCleanup(fichesPairs, userId);

      // nettoie les notifications pour les pilotes qui ne sont plus assignés
      const allFicheIds = fichesToCleanup.map((f) => f.ficheId);
      const allPendingNotifications =
        await this.getPendingNotificationsForFiches(transaction, allFicheIds);
      await this.cleanupNotificationsForRemovedPilotes({
        transaction,
        fichesToCleanup,
        allPendingNotifications,
      });

      if (pilotesByUserId.size === 0) {
        return;
      }

      // récupère les notifications existantes pour tous les pilotes concernés
      const allPiloteUserIds = Array.from(pilotesByUserId.keys());
      const existingNotificationsByUserId =
        await this.getExistingNotificationsForPilotes(
          transaction,
          allPiloteUserIds
        );

      // calcule la date d'envoi
      const sendAfter = this.calculateSendAfterDate();

      // met à jour ou crée les notifications groupées par pilote
      const pilotesWithFicheIds = Array.from(pilotesByUserId.values());
      const result = await this.upsertPilotesNotifications({
        transaction,
        pilotesWithFicheIds,
        user,
        existingNotificationsByUserId,
        sendAfter,
      });

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
      this.logger.error(
        `upsertPiloteNotificationsBulk error: ${JSON.stringify(error)}`
      );
      return { success: false, error: (error as DatabaseError).message };
    }

    return {
      success: true,
      data: { count: insertedCount },
    };
  }

  /**
   * Nettoie les notifications pour les pilotes qui ne sont plus assignés.
   * Traite toutes les fiches en une seule passe par notification pour éviter
   * les incohérences dues aux données périmées en mémoire.
   */
  private async cleanupNotificationsForRemovedPilotes({
    transaction,
    fichesToCleanup,
    allPendingNotifications,
  }: {
    transaction: Transaction;
    fichesToCleanup: Array<{
      ficheId: number;
      currentPiloteUserIds: string[];
    }>;
    allPendingNotifications: Notification[];
  }): Promise<void> {
    for (const notification of allPendingNotifications) {
      const {
        data: notificationData,
        success,
        error,
      } = onUpdateFichePiloteNotificationDataSchema.safeParse(
        notification.notificationData
      );
      if (!success) {
        this.logger.error(error);
        continue;
      }

      // garde les ficheIds pour lesquels le destinataire est toujours pilote
      // (ou qui ne font pas partie du cleanup)
      const remainingFicheIds = notificationData.ficheIds.filter((ficheId) => {
        const ficheCleanup = fichesToCleanup.find((f) => f.ficheId === ficheId);
        return (
          !ficheCleanup ||
          ficheCleanup.currentPiloteUserIds.includes(notification.sendTo)
        );
      });

      if (remainingFicheIds.length === notificationData.ficheIds.length) {
        continue;
      }

      if (remainingFicheIds.length === 0) {
        // supprime la notification si plus aucune fiche
        await transaction
          .delete(notificationTable)
          .where(eq(notificationTable.id, notification.id));
      } else {
        // met à jour la notification en ne gardant que les ficheIds restants
        await transaction
          .update(notificationTable)
          .set({
            notificationData: {
              ficheIds: remainingFicheIds,
              piloteId: notificationData.piloteId,
            },
          })
          .where(eq(notificationTable.id, notification.id));
      }
    }
  }

  /**
   * Récupère toutes les notifications pending pour les fiches données
   */
  private async getPendingNotificationsForFiches(
    transaction: Transaction,
    ficheIds: number[]
  ): Promise<Notification[]> {
    if (ficheIds.length === 0) {
      return [];
    }

    // récupère toutes les notifications pending qui contiennent au moins un des ficheIds
    // utilise OR avec plusieurs conditions @> pour vérifier chaque ficheId
    const conditions = ficheIds.map(
      (ficheId) =>
        sql`${notificationTable.notificationData}->'ficheIds' @> ${[
          ficheId,
        ]}::jsonb`
    );

    const allPendingNotifications = await transaction
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.status, NotificationStatusEnum.PENDING),
          eq(notificationTable.notifiedOn, NotifiedOnEnum.UPDATE_FICHE_PILOTE),
          or(...conditions)
        )
      );

    return allPendingNotifications;
  }

  /**
   * Récupère les notifications existantes pour les pilotes donnés
   */
  private async getExistingNotificationsForPilotes(
    transaction: Transaction,
    piloteUserIds: string[]
  ): Promise<Map<string, Notification>> {
    if (piloteUserIds.length === 0) {
      return new Map();
    }

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
    return DateTime.now()
      .plus(this.getDelayBeforeSendingNotification())
      .toUTC()
      .toString();
  }

  /**
   * Met à jour ou crée les notifications pour les pilotes avec leurs ficheIds associés
   */
  private async upsertPilotesNotifications({
    pilotesWithFicheIds,
    existingNotificationsByUserId,
    sendAfter,
    user,
    transaction,
  }: {
    pilotesWithFicheIds: Array<{
      pilote: UserWithEmail;
      ficheIds: number[];
    }>;
    existingNotificationsByUserId: Map<string, Notification>;
    sendAfter: string;
    user: AuthUser;
    transaction: Transaction;
  }): Promise<{ insertedCount: number }> {
    const notificationsToInsert: OnUpdateFichePiloteNotificationInsert[] = [];

    const delayBeforeSending = this.getDelayBeforeSendingNotification();
    for (const { pilote, ficheIds } of pilotesWithFicheIds) {
      const existingNotification = existingNotificationsByUserId.get(
        pilote.userId
      );

      if (existingNotification) {
        // met à jour la notification existante
        const notificationData = existingNotification.notificationData as {
          ficheIds: number[];
          piloteId: string;
        };
        // fusionne les ficheIds en évitant les doublons
        const mergedFicheIds = [
          ...new Set([...notificationData.ficheIds, ...ficheIds]),
        ];

        await transaction
          .update(notificationTable)
          .set({
            notificationData: {
              ficheIds: mergedFicheIds,
              piloteId: pilote.userId,
            },
            sendAfter,
          })
          .where(eq(notificationTable.id, existingNotification.id));
      } else {
        // prépare la création d'une nouvelle notification
        notificationsToInsert.push({
          createdBy: user.id,
          status: NotificationStatusEnum.PENDING,
          sendTo: pilote.userId,
          notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
          notificationData: {
            ficheIds,
            piloteId: pilote.userId,
          },
        });
      }
    }

    // crée toutes les nouvelles notifications
    if (notificationsToInsert.length > 0) {
      const insertedNotifications =
        await this.notificationsService.createPendingNotifications(
          notificationsToInsert,
          delayBeforeSending,
          transaction
        );
      if (insertedNotifications.success) {
        return { insertedCount: insertedNotifications.data.length };
      }
    }

    return { insertedCount: 0 };
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

  /** Donne les userIds des pilotes d'une fiche */
  private getPiloteUserIds(fiche: FicheWithRelations): string[] {
    return (
      (fiche.pilotes?.map((p) => p.userId).filter(Boolean) as string[]) ?? []
    );
  }

  /**
   * Groupe les pilotes nouvellement assignés par userId avec leurs ficheIds,
   * et collecte les pilotes actuels par fiche pour le nettoyage.
   */
  private getPilotesByUserIdAndFichesToCleanup(
    fichesPairs: Array<{
      previousFiche: FicheWithRelations;
      updatedFiche: FicheWithRelations;
    }>,
    userId: string
  ): {
    pilotesByUserId: Map<string, { pilote: UserWithEmail; ficheIds: number[] }>;
    fichesToCleanup: Array<{
      ficheId: number;
      currentPiloteUserIds: string[];
    }>;
  } {
    const pilotesByUserId = new Map<
      string,
      { pilote: UserWithEmail; ficheIds: number[] }
    >();
    const fichesToCleanup: Array<{
      ficheId: number;
      currentPiloteUserIds: string[];
    }> = [];

    for (const { previousFiche, updatedFiche } of fichesPairs) {
      const pilotes = this.getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );
      const ficheId = updatedFiche.id;

      fichesToCleanup.push({
        ficheId,
        currentPiloteUserIds: this.getPiloteUserIds(updatedFiche),
      });

      for (const pilote of pilotes) {
        const existing = pilotesByUserId.get(pilote.userId);
        if (existing) {
          if (!existing.ficheIds.includes(ficheId)) {
            existing.ficheIds.push(ficheId);
          }
        } else {
          pilotesByUserId.set(pilote.userId, {
            pilote,
            ficheIds: [ficheId],
          });
        }
      }
    }

    return { pilotesByUserId, fichesToCleanup };
  }
}
