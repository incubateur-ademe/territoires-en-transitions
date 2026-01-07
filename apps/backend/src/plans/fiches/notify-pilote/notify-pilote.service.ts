import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { NotificationStatusEnum } from '@tet/backend/utils/notifications/models/notification-status.enum';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import {
  Notification,
  NotificationInsert,
  notificationTable,
} from '@tet/backend/utils/notifications/models/notification.table';
import { NotifiedOnEnum } from '@tet/backend/utils/notifications/models/notified-on.enum';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { Result } from '@tet/backend/utils/result.type';
import { PersonneTagOrUserWithContacts } from '@tet/domain/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { and, eq, inArray, not } from 'drizzle-orm';
import { differenceBy, isNil } from 'es-toolkit';
import { DatabaseError } from 'pg';
import { z } from 'zod';
import GetPlanUrlService from '../../utils/get-plan-url.service';
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
  ficheId: z.number(),
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

@Injectable()
export class NotifyPiloteService {
  private readonly logger = new Logger(NotifyPiloteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listFichesService: ListFichesService,
    private readonly listUsersService: ListUsersService,
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
      // supprime les notifications pending destinés aux utilisateurs qui ne
      // sont plus assignés comme pilote de la fiche
      const currentPiloteUserIds =
        updatedFiche.pilotes
          ?.filter((p) => p.userId)
          .map((p) => p.userId as string) ?? [];

      const pendingPiloteNotificationConditions = [
        eq(notificationTable.entityId, String(ficheId)),
        eq(notificationTable.status, NotificationStatusEnum.PENDING),
        eq(notificationTable.notifiedOn, NotifiedOnEnum.UPDATE_FICHE_PILOTE),
      ];

      if (currentPiloteUserIds.length > 0) {
        await transaction
          .delete(notificationTable)
          .where(
            and(
              ...pendingPiloteNotificationConditions,
              not(inArray(notificationTable.sendTo, currentPiloteUserIds))
            )
          );
      } else {
        // si aucun pilote avec userId, supprime toutes les notifications pending pour cette fiche
        await transaction
          .delete(notificationTable)
          .where(and(...pendingPiloteNotificationConditions));
      }

      if (!pilotes.length) {
        return;
      }

      // vérifie quelles notifications existent déjà
      const userIds = pilotes.map((p) => p.userId);
      const existingNotifications = await transaction
        .select({ userId: notificationTable.sendTo })
        .from(notificationTable)
        .where(
          and(
            ...pendingPiloteNotificationConditions,
            inArray(notificationTable.sendTo, userIds)
          )
        );

      const existingUserIds = new Set(
        existingNotifications.map((n) => n.userId)
      );

      // insère uniquement les notifications qui n'existent pas encore
      const notificationsToInsert: OnUpdateFichePiloteNotificationInsert[] =
        pilotes
          .filter((pilote) => !existingUserIds.has(pilote.userId))
          .map((pilote) => ({
            createdBy: user.id,
            entityId: String(ficheId),
            status: NotificationStatusEnum.PENDING,
            sendTo: pilote.userId,
            notifiedOn: NotifiedOnEnum.UPDATE_FICHE_PILOTE,
            notificationData: { ficheId, piloteId: pilote.userId },
          }));
      if (notificationsToInsert.length > 0) {
        await transaction
          .insert(notificationTable)
          .values(notificationsToInsert);

        insertedCount = notificationsToInsert.length;
      }
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

    return { success: true, data: { count: insertedCount } };
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
    return {
      success: true,
      data: {
        sendToEmail,
        subject,
        content: NotifyPiloteEmail(templateData),
      },
    };
  }

  /**
   * Prépare les données nécessaires à l'envoi de la notification aux pilotes
   * nouvellement affectés à la fiche
   */
  private async getPiloteNotificationTemplateData(
    notification: Notification
  ): Promise<Result<NotifyPiloteProps, string>> {
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
    const { ficheId, piloteId } = data;

    const result = await this.listFichesService.getFicheById(ficheId);
    if (!result.success) {
      return { success: false, error: 'Action non trouvée' };
    }
    const fiche = result.data;
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
    const createdByUser = await this.listUsersService.getUserInfoById(
      createdBy
    );
    if (!createdByUser) {
      return {
        success: false,
        error: "Auteur de l'assignation du pilote non trouvé",
      };
    }
    const pilote = await this.listUsersService.getUserInfoById(piloteId);
    if (!pilote) {
      return { success: false, error: 'Pilote non trouvé' };
    }

    const plan = fiche.plans?.[0];
    return {
      success: true,
      data: {
        sendToEmail: pilote.email,
        subject: `Vous avez été assigné(e) à une ${
          fiche.parentId ? 'sous-' : ''
        }action sur Territoires en Transitions`,
        assignedTo: pilote.nom,
        assignedBy: [createdByUser.prenom, createdByUser.nom].join(' '),
        actionTitre: ficheParente ? ficheParente.titre : fiche.titre,
        sousActionTitre: ficheParente ? fiche.titre : '',
        planNom: plan?.nom || null,
        dateFin: fiche.dateFin,
        description: fiche.description,
        isSousAction: !!fiche.parentId,
        actionUrl: this.getPlanUrlService.getFicheUrl({
          collectiviteId: fiche.collectiviteId,
          ficheId: fiche.id,
          parentId: fiche.parentId,
          planId: plan?.id || null,
        }),
      },
    };
  }
}
