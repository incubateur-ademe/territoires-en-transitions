import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import GetDemarcheUrlService from '@tet/backend/demarches/shared/get-demarche-url.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import {
  Notification,
  NotificationInsert,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { PcaetInstructeursRepository } from '../../shared/pcaet-instructeurs.repository';
import { ListDestinatairesDemarcheService } from '../list-destinataires-demarche.service';
import { NotifyInstructionCloseEmail } from './notify-instruction-close.email';
import {
  MotifCloture,
  NotifyInstructionCloseProps,
} from './notify-instruction-close.props';

/**
 * `motif` est la seule donnée non reconstituable stockée ici, et c'est voulu :
 * c'est un fait daté. Le relire supposerait de retrouver la bonne ligne du
 * journal, alors que la transition appliquée est connue au moment de la bascule.
 */
const instructionCloseNotificationDataSchema = z.object({
  demarcheId: z.number().int().positive(),
  collectiviteId: z.number().int().positive(),
  motif: z.enum([
    DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
    DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
  ]),
  /**
   * La saisine de la DREAL en copie dont le destinataire est membre — absente
   * quand il écrit à la collectivité. C'est elle qui mène à son dossier.
   */
  copieDemandeAvisId: z.number().int().positive().optional(),
});

type InstructionCloseNotificationData = z.infer<
  typeof instructionCloseNotificationDataSchema
>;

type InstructionCloseNotificationInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: InstructionCloseNotificationData;
};

@Injectable()
export class NotifyInstructionCloseService {
  private readonly logger = new Logger(NotifyInstructionCloseService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listDestinatairesService: ListDestinatairesDemarcheService,
    private readonly instructeursRepository: PcaetInstructeursRepository,
    private readonly getDemarcheUrlService: GetDemarcheUrlService,
    private readonly listUsersService: ListUsersService,
    private readonly databaseService: DatabaseService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
      (notification: Notification) => this.getContent(notification)
    );
  }

  /**
   * Prévient la collectivité que son dossier est instruit, et met la DREAL en
   * copie.
   *
   * N'est appelée que lorsque la bascule a bien eu lieu : la clôture est tentée
   * à chaque avis validé et ne produit rien la plupart du temps.
   *
   * `createdBy` reste nul : personne n'a clos cette instruction, c'est un
   * constat du système.
   */
  async creerNotifications(
    params: { demarcheId: number; collectiviteId: number; motif: MotifCloture },
    tx?: Transaction
  ): Promise<void> {
    // Sur le chemin du planificateur, la bascule est déjà commitée et la passe
    // enchaîne les dossiers : une exception ici emporterait tous les suivants.
    try {
      await this.creer(params, tx);
    } catch (error) {
      this.logger.error(
        `Notifications de clôture en échec sur la démarche ${params.demarcheId} : ${error}`
      );
    }
  }

  private async creer(
    {
      demarcheId,
      collectiviteId,
      motif,
    }: { demarcheId: number; collectiviteId: number; motif: MotifCloture },
    tx?: Transaction
  ): Promise<void> {
    const [destinataires, enCopie] = await Promise.all([
      this.listDestinatairesService.list({ demarcheId, collectiviteId }, tx),
      this.listDestinatairesService.listEnCopie(
        { demarcheId, services: ['dreal'] },
        tx
      ),
    ]);

    const notification = (
      sendTo: string,
      copieDemandeAvisId?: number
    ): InstructionCloseNotificationInsert => ({
      entityId: String(demarcheId),
      status: NotificationStatusEnum.PENDING,
      sendTo,
      notifiedOn: NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
      notificationData: {
        demarcheId,
        collectiviteId,
        motif,
        copieDemandeAvisId,
      },
    });
    // Un agent qui reçoit déjà le message de la collectivité n'a pas à le
    // recevoir une seconde fois en copie.
    const dejaNotifies = new Set(destinataires.map(({ userId }) => userId));
    const notifications = [
      ...destinataires.map(({ userId }) => notification(userId)),
      ...enCopie
        .filter(({ userId }) => !dejaNotifies.has(userId))
        .map(({ userId, demandeAvisId }) =>
          notification(userId, demandeAvisId)
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
        `Notifications de clôture de la démarche ${demarcheId} non créées : ${result.error}`
      );
    }
  }

  private async getContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    const parsed = instructionCloseNotificationDataSchema.safeParse(
      notification.notificationData
    );
    if (!parsed.success) {
      return { success: false, error: 'PARSING_NOTIFICATION_DATA_ERROR' };
    }
    const { demarcheId, collectiviteId, motif, copieDemandeAvisId } =
      parsed.data;

    const [demarche] = await this.databaseService.db
      .select({
        titre: demarcheTable.titre,
        collectiviteNom: collectiviteTable.nom,
      })
      .from(demarcheTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(eq(demarcheTable.id, demarcheId))
      .limit(1);
    if (!demarche) {
      return { success: false, error: 'DEMARCHE_NOT_FOUND' };
    }

    const destinataire = await this.listUsersService.getUserBasicInfo({
      userId: notification.sendTo,
    });
    if (!destinataire) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    let copie: NotifyInstructionCloseProps['copie'] = null;
    if (copieDemandeAvisId !== undefined) {
      const destinataireServiceNom =
        await this.instructeursRepository.getServiceNom(copieDemandeAvisId);
      if (destinataireServiceNom === null) {
        return { success: false, error: 'DEMANDE_AVIS_NOT_FOUND' };
      }
      copie = {
        collectiviteNom: demarche.collectiviteNom,
        destinataireServiceNom,
      };
    }

    const props: NotifyInstructionCloseProps = {
      sendToEmail: destinataire.email,
      subject: copie
        ? `Le projet de PCAET de ${copie.collectiviteNom} est instruit`
        : 'Finalisez votre dépôt de PCAET',
      demarcheTitre: demarche.titre,
      motif,
      copie,
      url:
        copieDemandeAvisId === undefined
          ? this.getDemarcheUrlService.getDemarchePcaetDocumentsUrl({
              collectiviteId,
              demarcheId,
            })
          : this.getDemarcheUrlService.getDossierInstructionUrl({
              collectiviteInstruiteId: collectiviteId,
              demandeAvisId: copieDemandeAvisId,
            }),
    };

    return {
      success: true,
      data: {
        sendToEmail: props.sendToEmail,
        subject: props.subject,
        content: NotifyInstructionCloseEmail(props),
      },
    };
  }
}
