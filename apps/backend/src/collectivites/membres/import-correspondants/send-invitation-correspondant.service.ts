import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { peutDeposerAvisInstructeur } from '@tet/domain/demarches';
import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/components';
import { InvitationCorrespondantEmail } from './invitation-correspondant.email';
import { ServiceResolu } from './resolve-service.repository';

export type CibleInvitation =
  | { urlType: 'invitation'; invitationId: string }
  | { urlType: 'rattachement' };

/** Le statut que le transport a rendu, tel que le rapport d'import le montre. */
export type EchecEnvoi = 'pending' | 'rejected' | 'unknown' | 'not-whitelisted';

/**
 * L'envoi du premier message à un correspondant de service.
 *
 * Distinct de `SendInvitationService`, qui compose sujet et corps avec le nom
 * de l'expéditeur et refuse un profil incomplet : ici personne n'invite
 * nommément, c'est une campagne. Seule l'infrastructure est partagée.
 */
@Injectable()
export class SendInvitationCorrespondantService {
  private readonly logger = new Logger(SendInvitationCorrespondantService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configurationService: ConfigurationService
  ) {}

  async send({
    to,
    service,
    role,
    cible,
  }: {
    to: string;
    service: ServiceResolu;
    role: CollectiviteRole;
    cible: CibleInvitation;
  }): Promise<Result<{ messageId: string }, EchecEnvoi>> {
    const html = await render(
      InvitationCorrespondantEmail({
        sendToEmail: to,
        serviceNom: service.nom,
        deposeUnAvis: peutDeposerAvisInstructeur(service.type),
        estAdministrateur: role === CollectiviteRole.ADMIN,
        urlType: cible.urlType,
        actionUrl: this.actionUrl(service, cible),
      })
    );

    const sendResult = await this.emailService.sendEmail({
      to,
      // Le nom du service ouvre le corps, pas l'objet : les dénominations
      // officielles dépassent les cent caractères et seraient tronquées.
      subject: 'Territoires en Transitions : votre accès à l\'espace PCAET',
      html,
    });

    if (!sendResult.success) {
      this.logger.error(
        `Échec envoi au correspondant du service ${service.collectiviteId} : ${sendResult.error.status} — ${sendResult.error.errorMessage}`
      );
      return failure(sendResult.error.status);
    }

    return success({ messageId: sendResult.data.messageId });
  }

  private actionUrl(service: ServiceResolu, cible: CibleInvitation): string {
    const appUrl = this.configurationService.get('APP_URL').replace(/\/+$/, '');

    if (cible.urlType === 'invitation') {
      return `${appUrl}/invitation/${cible.invitationId}`;
    }

    // La racine d'un service déconcentré n'est pas `/accueil` : il n'a ni plans
    // ni référentiels, et les routes standard le renvoient vers l'instruction.
    // Un conseil régional, lui, garde son tableau de bord.
    return isServiceDeconcentre(service.type)
      ? `${appUrl}/collectivite/${service.collectiviteId}/demandes-avis`
      : `${appUrl}/collectivite/${service.collectiviteId}/accueil`;
  }
}
