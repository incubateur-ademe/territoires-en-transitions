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
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { pcaetAvisTable } from '../../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../../shared/models/pcaet-demande-avis.table';
import { PcaetInstructeursRepository } from '../../shared/pcaet-instructeurs.repository';
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
  /**
   * La saisine du service en copie dont le destinataire est membre — absente
   * quand il écrit à la collectivité. C'est elle qui mène à son dossier.
   */
  copieDemandeAvisId: z.number().int().positive().optional(),
  /**
   * L'EPCI couvert par le dépôt d'un Supra dont le destinataire est
   * administrateur — absent quand il écrit au porteur.
   */
  couverteCollectiviteId: z.number().int().positive().optional(),
});

type AvisRecuNotificationData = z.infer<typeof avisRecuNotificationDataSchema>;

type AvisRecuNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: AvisRecuNotificationData;
};

/** La collectivité déposante, distincte du service qui s'est prononcé. */
const deposanteTable = alias(collectiviteTable, 'deposante');

/** Les libellés des titres, pour le corps du message. */
const libelleAuTitreDe: Record<string, string> = {
  [PcaetAvisAuTitreDeEnum.PREFET_REGION]: 'Préfet de région',
  [PcaetAvisAuTitreDeEnum.PRESIDENT_REGION]: 'Président du conseil régional',
};

@Injectable()
export class NotifyAvisRecuService {
  private readonly logger = new Logger(NotifyAvisRecuService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listDestinatairesService: ListDestinatairesDemarcheService,
    private readonly instructeursRepository: PcaetInstructeursRepository,
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
   * Prévient la collectivité qu'un avis vient d'être rendu sur son dossier, les
   * EPCI que couvre son dépôt si c'est un Supra, et met en copie la DREAL et la
   * DGEC — sauf le service qui vient de se prononcer.
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

    const [destinataires, couverts, enCopie] = await Promise.all([
      this.listDestinatairesService.list(cible, tx),
      this.listDestinatairesService.listCouverts(cible, tx),
      this.listDestinatairesService.listEnCopie(
        {
          demarcheId: cible.demarcheId,
          services: ['dreal', 'dgec'],
          exclureCollectiviteId: cible.emetteurCollectiviteId,
        },
        tx
      ),
    ]);

    const notification = (
      sendTo: string,
      destination: Pick<
        AvisRecuNotificationData,
        'copieDemandeAvisId' | 'couverteCollectiviteId'
      > = {}
    ): AvisRecuNotificationInsert => ({
      createdBy,
      entityId: avisId,
      status: NotificationStatusEnum.PENDING,
      sendTo,
      notifiedOn: NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
      notificationData: { demandeAvisId, avisId, ...destination },
    });
    // Un seul message par personne : celui du porteur d'abord, puis celui de
    // l'EPCI couvert, enfin la copie.
    const dejaNotifies = new Set(destinataires.map(({ userId }) => userId));
    const couvertsANotifier = couverts.filter(
      ({ userId }) => !dejaNotifies.has(userId)
    );
    couvertsANotifier.forEach(({ userId }) => dejaNotifies.add(userId));
    const notifications = [
      ...destinataires.map(({ userId }) => notification(userId)),
      ...couvertsANotifier.map(({ userId, collectiviteCouverteId }) =>
        notification(userId, { couverteCollectiviteId: collectiviteCouverteId })
      ),
      ...enCopie
        .filter(({ userId }) => !dejaNotifies.has(userId))
        .map(({ userId, demandeAvisId }) =>
          notification(userId, { copieDemandeAvisId: demandeAvisId })
        ),
    ];
    if (notifications.length === 0) {
      return;
    }

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

    const { copieDemandeAvisId, couverteCollectiviteId } = parsed.data;
    let couverture: NotifyAvisRecuProps['couverture'] = null;
    if (couverteCollectiviteId !== undefined) {
      const collectiviteCouverteNom =
        await this.listDestinatairesService.getCollectiviteCouverteNom({
          demarcheId: avis.demarcheId,
          collectiviteId: couverteCollectiviteId,
        });
      if (collectiviteCouverteNom === null) {
        return { success: false, error: 'COLLECTIVITE_COUVERTE_NOT_FOUND' };
      }
      couverture = {
        porteurNom: avis.collectiviteNom,
        collectiviteCouverteNom,
      };
    }

    let copie: NotifyAvisRecuProps['copie'] = null;
    if (copieDemandeAvisId !== undefined) {
      const destinataireServiceNom =
        await this.instructeursRepository.getServiceNom(copieDemandeAvisId);
      if (destinataireServiceNom === null) {
        return { success: false, error: 'DEMANDE_AVIS_NOT_FOUND' };
      }
      copie = { collectiviteNom: avis.collectiviteNom, destinataireServiceNom };
    }

    const props: NotifyAvisRecuProps = {
      sendToEmail: destinataire.email,
      subject: copie
        ? `Avis rendu par ${avis.serviceNom} sur le projet de PCAET de ${avis.collectiviteNom}`
        : couverture
        ? `Avis rendu sur le projet de PCAET porté par ${couverture.porteurNom}`
        : "Consultez l'avis rendu sur votre projet de PCAET",
      demarcheTitre: avis.demarcheTitre,
      serviceNom: avis.serviceNom,
      auTitreDe: libelleAuTitreDe[avis.auTitreDe] ?? null,
      copie,
      couverture,
      // L'EPCI couvert lit le dépôt sous l'identifiant du porteur, comme lui.
      url:
        copieDemandeAvisId === undefined
          ? this.getDemarcheUrlService.getDemarchePcaetDocumentsUrl({
              collectiviteId: avis.collectiviteId,
              demarcheId: avis.demarcheId,
            })
          : this.getDemarcheUrlService.getDossierInstructionUrl({
              collectiviteInstruiteId: avis.collectiviteId,
              demandeAvisId: copieDemandeAvisId,
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
    collectiviteNom: string;
    demarcheTitre: string;
    serviceNom: string;
    auTitreDe: string;
  } | null> {
    const rows = await this.databaseService.db
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        collectiviteNom: deposanteTable.nom,
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
        deposanteTable,
        eq(deposanteTable.id, demarcheTable.collectiviteId)
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
  ): Promise<{
    demarcheId: number;
    collectiviteId: number;
    /** Le service saisi par cette demande, qui vient de se prononcer. */
    emetteurCollectiviteId: number;
  } | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        emetteurCollectiviteId: pcaetDemandeAvisTable.instructeurCollectiviteId,
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
