import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import GetDemarcheUrlService from '@tet/backend/demarches/shared/get-demarche-url.service';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { PcaetAvisAuTitreDeEnum } from '@tet/domain/demarches';
import {
  Notification,
  NotificationInsert,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { pcaetAvisTable } from '../../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../../shared/models/pcaet-demande-avis.table';
import { ListDestinatairesDemarcheService } from '../list-destinataires-demarche.service';
import { NotifyAvisRecuEmail } from './notify-avis-recu.email';
import { NotifyAvisRecuProps } from './notify-avis-recu.props';

/**
 * Seuls des identifiants : le titre de la démarche et le nom du service sont
 * relus à l'envoi, pour que le message dise l'état du jour et non celui de la
 * minute où l'avis a été validé.
 */
const avisRecuNotificationDataSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  avisId: z.string().uuid(),
});

type AvisRecuNotificationData = z.infer<typeof avisRecuNotificationDataSchema>;

type AvisRecuNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: AvisRecuNotificationData;
};

/** Les libellés des titres, pour le corps du message. */
const libelleAuTitreDe: Record<string, string> = {
  [PcaetAvisAuTitreDeEnum.PREFET_REGION]: 'Préfet de région',
  [PcaetAvisAuTitreDeEnum.PRESIDENT_REGION]: 'Président de région',
};

@Injectable()
export class NotifyAvisRecuService {
  private readonly logger = new Logger(NotifyAvisRecuService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listDestinatairesService: ListDestinatairesDemarcheService,
    private readonly getDemarcheUrlService: GetDemarcheUrlService,
    private readonly listUsersService: ListUsersService,
    private readonly databaseService: DatabaseService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
      (notification: Notification) => this.getContent(notification)
    );
  }

  /**
   * Prévient la collectivité qu'un avis vient d'être rendu sur son dossier.
   *
   * Appelée dans la transaction qui valide l'avis : si la validation échoue, la
   * notification part avec elle plutôt que d'annoncer un avis qui n'existe pas.
   */
  async creerNotifications(
    params: { demandeAvisId: number; avisId: string; createdBy: string },
    tx?: Transaction
  ): Promise<void> {
    // La validation de l'avis prime : elle ne doit pas échouer parce que la
    // notification n'a pas pu être écrite.
    try {
      await this.creer(params, tx);
    } catch (error) {
      this.logger.error(
        `Notifications de l'avis ${params.avisId} en échec : ${error}`
      );
    }
  }

  private async creer(
    {
      demandeAvisId,
      avisId,
      createdBy,
    }: { demandeAvisId: number; avisId: string; createdBy: string },
    tx?: Transaction
  ): Promise<void> {
    const cible = await this.getCible(demandeAvisId, tx);
    if (!cible) {
      this.logger.warn(
        `Demande d'avis ${demandeAvisId} introuvable : avis ${avisId} validé sans notification`
      );
      return;
    }

    const destinataires = await this.listDestinatairesService.list(cible, tx);
    if (destinataires.length === 0) {
      return;
    }

    const notifications: AvisRecuNotificationInsert[] = destinataires.map(
      ({ userId }) => ({
        createdBy,
        entityId: avisId,
        status: NotificationStatusEnum.PENDING,
        sendTo: userId,
        notifiedOn: NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        notificationData: { demandeAvisId, avisId },
      })
    );

    const result = await this.notificationsService.createPendingNotifications(
      notifications,
      undefined,
      tx
    );
    if (!result.success) {
      this.logger.error(
        `Notifications de l'avis ${avisId} non créées : ${result.error}`
      );
    }
  }

  private async getContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    const parsed = avisRecuNotificationDataSchema.safeParse(
      notification.notificationData
    );
    if (!parsed.success) {
      return { success: false, error: 'PARSING_NOTIFICATION_DATA_ERROR' };
    }

    const avis = await this.getAvisPourMessage(parsed.data);
    if (!avis) {
      // L'avis a été supprimé entre la validation et l'envoi : mieux vaut ne
      // rien dire que d'annoncer une pièce introuvable.
      return { success: false, error: 'AVIS_NOT_FOUND' };
    }

    const destinataire = await this.listUsersService.getUserBasicInfo({
      userId: notification.sendTo,
    });
    if (!destinataire) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const props: NotifyAvisRecuProps = {
      sendToEmail: destinataire.email,
      subject: 'Avis rendu sur votre projet de PCAET',
      demarcheTitre: avis.demarcheTitre,
      serviceNom: avis.serviceNom,
      auTitreDe: libelleAuTitreDe[avis.auTitreDe] ?? null,
      documentsUrl: this.getDemarcheUrlService.getDemarchePcaetDocumentsUrl({
        collectiviteId: avis.collectiviteId,
        demarcheId: avis.demarcheId,
      }),
    };

    return {
      success: true,
      data: {
        sendToEmail: props.sendToEmail,
        subject: props.subject,
        content: NotifyAvisRecuEmail(props),
      },
    };
  }

  /**
   * Ce que le message doit dire, relu à l'envoi : le dossier, son titre, et le
   * service qui s'est prononcé.
   */
  private async getAvisPourMessage({
    demandeAvisId,
    avisId,
  }: AvisRecuNotificationData): Promise<{
    demarcheId: number;
    collectiviteId: number;
    demarcheTitre: string;
    serviceNom: string;
    auTitreDe: string;
  } | null> {
    const rows = await this.databaseService.db
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        demarcheTitre: demarcheTable.titre,
        serviceNom: collectiviteTable.nom,
        auTitreDe: pcaetAvisTable.auTitreDe,
      })
      .from(pcaetAvisTable)
      .innerJoin(
        pcaetDemandeAvisTable,
        eq(pcaetDemandeAvisTable.id, pcaetAvisTable.demandeAvisId)
      )
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, pcaetAvisTable.emetteurCollectiviteId)
      )
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  private async getCible(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<{ demarcheId: number; collectiviteId: number } | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return rows[0] ?? null;
  }
}
