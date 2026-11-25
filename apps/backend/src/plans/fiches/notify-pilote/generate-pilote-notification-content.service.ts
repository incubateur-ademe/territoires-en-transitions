import { Injectable, Logger } from '@nestjs/common';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { UserPreferencesService } from '@tet/backend/users/preferences/user-preferences.service';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { Result } from '@tet/backend/utils/result.type';
import { FicheWithRelations } from '@tet/domain/plans';
import { Notification, NotifiedOnEnum } from '@tet/domain/utils';
import GetPlanUrlService from '../../utils/get-plan-url.service';
import { NotifyPiloteMultiFichesEmail } from './notify-pilote-multi-fiches.email';
import { NotifyPiloteMultiFichesProps } from './notify-pilote-multi-fiches.props';
import { onUpdateFichePiloteNotificationDataSchema } from './notify-pilote-notification-data.schema';
import { NotifyPiloteEmail } from './notify-pilote.email';
import { NotifyPiloteProps } from './notify-pilote.props';

@Injectable()
export class GeneratePiloteNotificationContentService {
  private readonly logger = new Logger(
    GeneratePiloteNotificationContentService.name
  );

  constructor(
    private readonly configService: ConfigurationService,
    private readonly listFichesService: ListFichesService,
    private readonly listUsersService: ListUsersService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly getPlanUrlService: GetPlanUrlService,
    notificationsService: NotificationsService
  ) {
    notificationsService.registerContentGenerator(
      NotifiedOnEnum.UPDATE_FICHE_PILOTE,
      (notification: Notification) => this.generate(notification)
    );
  }

  private getUnsubscribeUrl() {
    const appUrl = this.configService.get('APP_URL');
    return `${appUrl}/profil`;
  }

  /**
   * Charge les données et génère le contenu de la notification
   * (appelée lors de l'envoi des notifications)
   */
  async generate(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    // charge les données
    const ret = await this.getPiloteNotificationTemplateData(notification);
    if (!ret.success) {
      this.logger.error(`getPiloteNotificationTemplate error: ${ret.error}`);
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
    const result = await this.listFichesService.listFichesQuery({
      collectiviteId: null,
      filters: { ficheIds, withChildren: true },
      queryOptions: { limit: 'all' },
    });
    if (!result.success) {
      const error = `Echec de chargement des fiches ${ficheIds} pour notifier le pilote ${piloteId}`;
      this.logger.error(error, result.cause);
      return { success: false, error };
    }
    for (const ficheId of ficheIds) {
      const fiche = result.data.data.find((f) => f.id === ficheId);
      if (!fiche) {
        this.logger.error(`Action ${ficheId} non trouvée`);
      } else if (
        (!fiche.parentId && !isNotifyPiloteActionEnabled) ||
        (fiche.parentId && !isNotifyPiloteSousActionEnabled)
      ) {
        this.logger.log(
          `Notification pilote désactivée pour l'utilisateur "${piloteId}" et les ${
            fiche.parentId ? 'sous-actions' : 'actions'
          }`
        );
      } else {
        fiches.push(fiche);
      }
    }

    if (!fiches.length) {
      const error = `Echec de préparation des données pour notifier le pilote ${piloteId} des fiches ${ficheIds}`;
      this.logger.error(error);
      return {
        success: false,
        error,
      };
    }

    const createdByUser = await this.listUsersService.getUserBasicInfo({
      userId: createdBy,
    });
    if (!createdByUser) {
      const error = `Auteur ${createdBy} de l'assignation du pilote ${piloteId} non trouvé`;
      this.logger.error(error);
      return {
        success: false,
        error,
      };
    }
    const pilote = await this.listUsersService.getUserBasicInfo({
      userId: piloteId,
    });
    if (!pilote) {
      const error = `Pilote ${piloteId} non trouvé`;
      this.logger.error(error);
      return { success: false, error };
    }

    // si une seule fiche, utilise le format simple
    if (fiches.length === 1) {
      const fiche = fiches[0];
      let ficheParente;
      if (fiche.parentId) {
        const getParentResult = await this.listFichesService.getFicheById({
          ficheId: fiche.parentId,
        });
        if (!getParentResult.success) {
          const error = `Action parente ${fiche.parentId} non trouvée pour la fiche ${fiche.id}`;
          this.logger.error(error);
          return {
            success: false,
            error,
          };
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
          assignedTo: pilote.prenom,
          assignedBy: [createdByUser.prenom, createdByUser.nom].join(' '),
          assignedAction: this.getAssignedActionData(fiche, ficheParente),
          unsubscribeUrl: this.getUnsubscribeUrl(),
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
      const getParentsResult = await this.listFichesService.listFichesQuery({
        collectiviteId: null,
        filters: { ficheIds: Array.from(parentFicheIds) },
        queryOptions: { limit: 'all' },
      });
      if (!getParentsResult.success) {
        const error = `Echec de chargement des actions parentes des fiches ${ficheIds} pour notifier le pilote ${piloteId}`;
        this.logger.error(error, getParentsResult.cause);
        return { success: false, error };
      }
      parentFiches = getParentsResult.data.data;
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
        unsubscribeUrl: this.getUnsubscribeUrl(),
      },
    };
  }

  private getAssignedActionData(
    fiche: FicheWithRelations,
    ficheParente?: FicheWithRelations
  ) {
    const plan = ficheParente?.plans?.[0] || fiche.plans?.[0];
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
