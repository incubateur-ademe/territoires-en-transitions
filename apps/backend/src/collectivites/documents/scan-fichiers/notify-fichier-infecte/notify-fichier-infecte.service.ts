import { Injectable, Logger } from '@nestjs/common';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import {
  getErrorMessage,
  Notification,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { z } from 'zod';
import {
  type ObjectToScan,
  ScanFichiersRepository,
} from '../scan-fichiers.repository';
import { NotifyFichierInfecteEmail } from './notify-fichier-infecte.email';
import { NotifyFichierInfecteProps } from './notify-fichier-infecte.props';

const fichierInfecteNotificationDataSchema = z.object({
  bucketId: z.string().min(1),
  objectName: z.string().min(1),
});

/**
 * Prévient les administrateurs des collectivités dont un fichier a été
 * supprimé. Les noms de fichier sont relus à l'envoi : les lignes de
 * bibliothèque survivent à la suppression du blob.
 */
@Injectable()
export class NotifyFichierInfecteService {
  private readonly logger = new Logger(NotifyFichierInfecteService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly repository: ScanFichiersRepository,
    private readonly listUsersService: ListUsersService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['COLLECTIVITES.DOCUMENTS.FICHIER_INFECTE_SUPPRIME'],
      (notification: Notification) => this.getContent(notification)
    );
  }

  /** Ne lève jamais : le fichier est déjà supprimé, la suite du balayage continue. */
  async notify(object: ObjectToScan): Promise<void> {
    try {
      const fichiers = await this.repository.listFichiersOfObject(object);
      const collectiviteIds = [
        ...new Set(fichiers.map(({ collectiviteId }) => collectiviteId)),
      ];
      if (collectiviteIds.length === 0) {
        // Objet sans ligne de bibliothèque : personne ne le voyait.
        return;
      }

      for (const collectiviteId of collectiviteIds) {
        const adminIds = await this.repository.listAdminIds(collectiviteId);
        if (adminIds.length === 0) {
          this.logger.warn(
            `Fichier infecté supprimé dans la collectivité ${collectiviteId} : aucun administrateur à prévenir`
          );
          continue;
        }
        const result =
          await this.notificationsService.createPendingNotifications(
            adminIds.map((sendTo) => ({
              entityId: `${object.bucketId}/${object.objectName}`,
              status: NotificationStatusEnum.PENDING,
              sendTo,
              notifiedOn:
                NotifiedOnEnum[
                  'COLLECTIVITES.DOCUMENTS.FICHIER_INFECTE_SUPPRIME'
                ],
              notificationData: {
                bucketId: object.bucketId,
                objectName: object.objectName,
              },
            }))
          );
        if (!result.success) {
          this.logger.error(
            `Notifications de fichier infecté non créées pour la collectivité ${collectiviteId} : ${result.error}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Notifications de fichier infecté en échec pour ${object.bucketId}/${
          object.objectName
        } : ${getErrorMessage(error)}`
      );
    }
  }

  private async getContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    const parsed = fichierInfecteNotificationDataSchema.safeParse(
      notification.notificationData
    );
    if (!parsed.success) {
      return { success: false, error: 'PARSING_NOTIFICATION_DATA_ERROR' };
    }

    const fichiers = await this.repository.listFichiersOfObject(parsed.data);
    if (fichiers.length === 0) {
      return { success: false, error: 'FICHIER_NOT_FOUND' };
    }

    const destinataire = await this.listUsersService.getUserBasicInfo({
      userId: notification.sendTo,
    });
    if (!destinataire) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const props: NotifyFichierInfecteProps = {
      sendToEmail: destinataire.email,
      subject: 'Un fichier infecté a été supprimé de votre espace',
      collectiviteNom: fichiers[0].collectiviteNom ?? 'votre collectivité',
      filenames: [...new Set(fichiers.map(({ filename }) => filename))],
    };

    return {
      success: true,
      data: {
        sendToEmail: props.sendToEmail,
        subject: props.subject,
        content: NotifyFichierInfecteEmail(props),
      },
    };
  }
}
