import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, not } from 'drizzle-orm';
import { z } from 'zod';
import { FicheWithRelations } from '../plans/fiches/list-fiches/fiche-action-with-relations.dto';
import ListFichesService from '../plans/fiches/list-fiches/list-fiches.service';
import { AuthenticatedUser } from '../users/models/auth.models';
import { ListUsersService } from '../users/users/list-users/list-users.service';
import { DatabaseService } from '../utils/database/database.service';
import { Transaction } from '../utils/database/transaction.utils';
import GetUrlService from '../utils/get-url.service';
import { MethodResult } from '../utils/result.type';
import { getNewlyAssignedPilotes } from './get-newly-assigned-pilotes';
import { EmailNotificationNameEnum } from './models/email-notification-name.enum';
import { EmailNotificationStatusEnum } from './models/email-notification-status.enum';
import {
  EmailNotificationInsert,
  notificationTable,
} from './models/email-notification.table';
import { UpsertNotificationsResult } from './upsert-notifications.result';

export const fichePiloteNotificationDataSchema = z.object({
  ficheId: z.number(),
  piloteId: z.string().length(1),
});
type FichePiloteNotificationData = z.infer<
  typeof fichePiloteNotificationDataSchema
>;
type FichePiloteNotificationInsert = Omit<
  EmailNotificationInsert,
  'notificationData'
> & {
  notificationData: FichePiloteNotificationData;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listFichesService: ListFichesService,
    private readonly listUsersService: ListUsersService,
    private readonly getUrlService: GetUrlService
  ) {}

  /**
   * Insère/met à jour la notification à envoyer aux pilotes nouvellement
   * affectés à la fiche
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
    const pilotes = getNewlyAssignedPilotes(
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
        eq(notificationTable.status, EmailNotificationStatusEnum.PENDING),
        eq(
          notificationTable.notificationName,
          EmailNotificationNameEnum.UPDATE_FICHE_PILOTE
        ),
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
      const notificationsToInsert: FichePiloteNotificationInsert[] = pilotes
        .filter((pilote) => !existingUserIds.has(pilote.userId))
        .map((pilote) => ({
          createdBy: user.id,
          entityId: String(ficheId),
          status: EmailNotificationStatusEnum.PENDING,
          sendTo: pilote.userId,
          notificationName: EmailNotificationNameEnum.UPDATE_FICHE_PILOTE,
          notificationData: { ficheId, piloteId: pilote.userId },
        }));
      if (notificationsToInsert.length > 0) {
        await transaction
          .insert(notificationTable)
          .values(notificationsToInsert);

        insertedCount = notificationsToInsert.length;
      }
    };

    // Utilise la transaction fournie ou en crée une nouvelle
    await (tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(async (newTx) =>
          executeInTransaction(newTx)
        ));

    return { success: true, data: { count: insertedCount } };
  }

  /** Renvoi les données nécessaires à la notification UPDATE_FICHE_PILOTE */
  public async getUpdateFichePiloteNotifData({
    createdBy,
    piloteId,
    ficheId,
  }: {
    createdBy: string;
    piloteId: string;
    ficheId: number;
  }): MethodResult<FichePiloteNotificationData> {
    const fiche = await this.listFichesService.getFicheById(ficheId);
    if (!fiche) {
      return { success: false, error: 'Fiche non trouvée' };
    }
    let ficheParente;
    if (fiche.parentId) {
      ficheParente = await this.listFichesService.getFicheById(fiche.parentId);
      if (!ficheParente) {
        return { success: false, error: 'Fiche parente non trouvée' };
      }
    }
    const createdByUser = await this.listUsersService.getUserInfoById(
      createdBy
    );
    if (!createdByUser) {
      return { success: false, error: 'Pilote non trouvée' };
    }
    const pilote = await this.listUsersService.getUserInfoById(piloteId);
    if (!pilote) {
      return { success: false, error: 'Pilote non trouvée' };
    }

    const plan = fiche.plans?.[0];
    return {
      success: true,
      data: {
        assigned: pilote.nom,
        assignedBy: [createdByUser.prenom, createdByUser.nom].join(' '),
        actionTitre: ficheParente ? ficheParente.titre : fiche.titre,
        sousActionTitre: ficheParente ? fiche.titre : '',
        planNom: plan?.nom || null,
        dateFin: fiche.dateFin,
        description: fiche.description,
        actionUrl: this.getUrlService.getFicheUrl({
          collectiviteId: fiche.collectiviteId,
          ficheId: fiche.id,
          parentId: fiche.parentId,
          planId: plan?.id || null,
        }),
      },
    };
  }
}
