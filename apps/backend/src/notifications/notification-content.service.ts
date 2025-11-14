import { Injectable } from '@nestjs/common';
import { GetNotificationContentResult } from './models/notification-template.dto';
import { Notification } from './models/notification.table';
import { NotifiedOnEnum } from './models/notified-on.enum';
import { NotificationsFicheService } from './notifications-fiche.service';

@Injectable()
export class NotificationContentService {
  constructor(
    private readonly notificationsFicheService: NotificationsFicheService
  ) {}

  /**
   * Fourni le contenu de la notification à envoyer en fonction de son type
   */
  getNotificationContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    if (notification.notifiedOn === NotifiedOnEnum.UPDATE_FICHE_PILOTE) {
      return this.notificationsFicheService.getPiloteNotificationContent(
        notification
      );
    }

    return Promise.resolve({
      success: false,
      error: `Type de notification non reconnu: ${notification.notifiedOn}`,
    });
  }
}
