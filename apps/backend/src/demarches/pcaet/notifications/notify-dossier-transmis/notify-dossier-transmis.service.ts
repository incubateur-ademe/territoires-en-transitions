import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import GetDemarcheUrlService from '@tet/backend/demarches/shared/get-demarche-url.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { formatDate } from '@tet/backend/utils/notifications/components/format-date.utils';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { render } from '@react-email/components';
import {
  estInstructeurNational,
  peutDeposerAvisInstructeur,
  peutDeposerAvisSaisine,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import {
  Notification,
  NotificationInsert,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { CollectiviteContactsRepository } from '../../shared/collectivite-contacts.repository';
import { pcaetDemandeAvisTable } from '../../shared/models/pcaet-demande-avis.table';
import type { DemandeAvisDestinataire } from '../../shared/pcaet-instructeurs.repository';
import { NotifyDossierTransmisEmail } from './notify-dossier-transmis.email';
import { NotifyDossierTransmisProps } from './notify-dossier-transmis.props';
import { NotifySupportServicesSansCompteEmail } from './notify-support-services-sans-compte.email';
import type { ServiceSansCompte } from './notify-support-services-sans-compte.props';

/** La collectivité-service destinataire, distincte de la déposante. */
const serviceTable = alias(collectiviteTable, 'service_instructeur');

/** Le support, qui n'a pas de compte : la boîte partagée de l'équipe. */
const SUPPORT_EMAIL = 'contact@territoiresentransitions.fr';

/**
 * La saisine suffit à tout retrouver : le dossier, le service destinataire, et
 * s'il est saisi pour avis ou simple lecteur.
 */
const dossierTransmisNotificationDataSchema = z.object({
  demandeAvisId: z.number().int().positive(),
});

type DossierTransmisNotificationData = z.infer<
  typeof dossierTransmisNotificationDataSchema
>;

type DossierTransmisNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: DossierTransmisNotificationData;
};

@Injectable()
export class NotifyDossierTransmisService {
  private readonly logger = new Logger(NotifyDossierTransmisService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly collectiviteContactsRepository: CollectiviteContactsRepository,
    private readonly getDemarcheUrlService: GetDemarcheUrlService,
    private readonly listUsersService: ListUsersService,
    private readonly emailService: EmailService,
    private readonly databaseService: DatabaseService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS'],
      (notification: Notification) => this.getContent(notification)
    );
  }

  /**
   * Prévient les agents des services saisis, et rend ceux qu'on n'a pas pu
   * joindre — à charge de l'appelant d'en alerter le support une fois la
   * transmission acquise.
   *
   * Les services nationaux sont écartés : ils voient passer tous les dossiers du
   * pays, les notifier noierait leur boîte.
   */
  async creerNotifications(
    {
      demandes,
      createdBy,
    }: { demandes: DemandeAvisDestinataire[]; createdBy: string },
    tx?: Transaction
  ): Promise<ServiceSansCompte[]> {
    const aNotifier = demandes.filter(
      (demande) => !estInstructeurNational(demande.type)
    );
    if (aNotifier.length === 0) {
      return [];
    }

    const contactsParService =
      await this.collectiviteContactsRepository.listContactsParCollectivite(
        aNotifier.map((demande) => demande.collectiviteId),
        { roles: Object.values(CollectiviteRole) },
        tx
      );

    const notifications: DossierTransmisNotificationInsert[] = [];
    const servicesSansCompte: ServiceSansCompte[] = [];

    for (const demande of aNotifier) {
      const contacts = contactsParService.get(demande.collectiviteId) ?? [];
      if (contacts.length === 0) {
        servicesSansCompte.push({
          nom: demande.nom,
          saisiPourAvis: peutDeposerAvisSaisine(
            demande.type,
            demande.perimetre
          ),
        });
        continue;
      }

      for (const contact of contacts) {
        notifications.push({
          createdBy,
          entityId: String(demande.demandeAvisId),
          status: NotificationStatusEnum.PENDING,
          sendTo: contact.userId,
          notifiedOn:
            NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS'],
          notificationData: { demandeAvisId: demande.demandeAvisId },
        });
      }
    }

    if (notifications.length > 0) {
      const result = await this.notificationsService.createPendingNotifications(
        notifications,
        undefined,
        tx
      );
      if (!result.success) {
        this.logger.error(
          `Notifications de transmission non créées : ${result.error}`
        );
      }
    }

    return servicesSansCompte;
  }

  /**
   * Un seul message pour toute la transmission : en amorçage, plusieurs services
   * peuvent être sans compte le même jour, et l'unité d'action du support est le
   * dossier, pas le service.
   *
   * Hors de la transaction de la transmission : un envoi SMTP ne se rejoue pas à
   * l'envers, et un échec ici ne doit pas remettre le dossier en élaboration.
   */
  async alerterSupport(params: {
    demarche: DemarchePcaet;
    services: ServiceSansCompte[];
  }): Promise<void> {
    if (params.services.length === 0) {
      return;
    }

    // La transmission est déjà acquise : rien de ce qui suit ne doit la faire
    // échouer, sous peine de renvoyer une erreur pour un dossier bel et bien
    // transmis, qu'un réessai refuserait de retransmettre.
    try {
      await this.envoyerAlerteSupport(params);
    } catch (error) {
      this.logger.error(
        `Alerte support en échec pour la démarche ${params.demarche.id} : ${error}`
      );
    }
  }

  private async envoyerAlerteSupport({
    demarche,
    services,
  }: {
    demarche: DemarchePcaet;
    services: ServiceSansCompte[];
  }): Promise<void> {
    const [collectivite] = await this.databaseService.db
      .select({ nom: collectiviteTable.nom })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, demarche.collectiviteId))
      .limit(1);

    const html = await render(
      NotifySupportServicesSansCompteEmail({
        sendToEmail: SUPPORT_EMAIL,
        subject: '',
        collectiviteNom:
          collectivite?.nom ?? `collectivité ${demarche.collectiviteId}`,
        demarcheTitre: demarche.titre,
        services,
      })
    );

    const result = await this.emailService.sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[PCAET] Services consultés sans compte sur la plateforme — ${
        collectivite?.nom ?? demarche.collectiviteId
      }`,
      html,
    });
    if (!result.success) {
      this.logger.error(
        `Alerte support non envoyée pour la démarche ${demarche.id} : ${result.error.errorMessage}`
      );
    }
  }

  private async getContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    const parsed = dossierTransmisNotificationDataSchema.safeParse(
      notification.notificationData
    );
    if (!parsed.success) {
      return { success: false, error: 'PARSING_NOTIFICATION_DATA_ERROR' };
    }

    const saisine = await this.getSaisine(parsed.data.demandeAvisId);
    if (!saisine) {
      return { success: false, error: 'DEMANDE_AVIS_NOT_FOUND' };
    }

    const destinataire = await this.listUsersService.getUserBasicInfo({
      userId: notification.sendTo,
    });
    if (!destinataire) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // Recalculé à l'envoi : un périmètre corrigé entre-temps doit changer ce
    // que le message annonce.
    const saisiPourAvis = peutDeposerAvisSaisine(
      saisine.serviceType,
      saisine.perimetre
    );

    const props: NotifyDossierTransmisProps = {
      sendToEmail: destinataire.email,
      subject: `Projet de PCAET de ${saisine.collectiviteNom} : transmission pour avis`,
      collectiviteNom: saisine.collectiviteNom,
      serviceNom: saisine.serviceNom,
      saisiPourAvis,
      // Une famille qui rend des avis mais ne se prononce pas ici n'est atteinte
      // que par un territoire secondaire : c'est la seule autre raison possible.
      motifLecture: saisiPourAvis
        ? null
        : peutDeposerAvisInstructeur(saisine.serviceType)
        ? 'territoire'
        : 'famille',
      echeanceAvis: saisine.avisDeadlineAt
        ? formatDate(saisine.avisDeadlineAt)
        : null,
      dossierUrl: this.getDemarcheUrlService.getDossierInstructionUrl({
        collectiviteInstruiteId: saisine.collectiviteId,
        demandeAvisId: parsed.data.demandeAvisId,
      }),
    };

    return {
      success: true,
      data: {
        sendToEmail: props.sendToEmail,
        subject: props.subject,
        content: NotifyDossierTransmisEmail(props),
      },
    };
  }

  private async getSaisine(demandeAvisId: number) {
    const [saisine] = await this.databaseService.db
      .select({
        collectiviteId: demarcheTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        avisDeadlineAt: demarcheTable.avisDeadlineAt,
        serviceNom: serviceTable.nom,
        serviceType: serviceTable.type,
        perimetre: pcaetDemandeAvisTable.perimetre,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .innerJoin(
        serviceTable,
        eq(serviceTable.id, pcaetDemandeAvisTable.instructeurCollectiviteId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return saisine ?? null;
  }
}
