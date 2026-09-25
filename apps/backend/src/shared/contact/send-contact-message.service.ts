import { render } from '@react-email/components';
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import {
  SendContactMessageError,
  SendContactMessageErrorEnum,
} from './send-contact-message.errors';
import { SendContactMessageEmail } from './send-contact-message.email';
import {
  ContactObjet,
  SendContactMessageInput,
} from './send-contact-message.input';
import { siteContactTable } from './site-contact.table';

/** Boîte qui reçoit les demandes liées au programme Territoire Engagé. */
const EMAIL_PROGRAMME = 'territoireengage@ademe.fr';
/** Boîte qui reçoit tout le reste. */
const EMAIL_CONTACT = 'contact@territoiresentransitions.fr';

/**
 * Libellés des objets, repris de `apps/site/app/contact/data.ts`.
 * Dupliqués volontairement : le site porte le formulaire, le backend porte
 * l'email — les deux doivent rester alignés sur `contactObjets`.
 */
const OBJET_LABELS: Record<ContactObjet, string> = {
  programme:
    'Questions relatives au programme Territoire Engagé Transition Écologique',
  plateforme: 'Questions relatives à la plateforme Territoires en Transitions',
  autre: 'Autre',
};

@Injectable()
export class SendContactMessageService {
  private readonly logger = new Logger(SendContactMessageService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService
  ) {}

  async sendContactMessage(
    input: SendContactMessageInput
  ): Promise<Result<void, SendContactMessageError>> {
    const { website, ...formulaire } = input;

    // Piège à robots : un humain ne voit pas le champ. On renvoie un succès
    // sans rien faire, pour ne pas leur apprendre à le contourner.
    if (website) {
      this.logger.log('Message de contact ignoré : piège à robots rempli');
      return success(undefined);
    }

    const { objet, prenom, nom, email, tel, message } = formulaire;
    const to = objet === 'programme' ? EMAIL_PROGRAMME : EMAIL_CONTACT;

    // Trace d'abord, envoi ensuite : si l'email échoue, le message reste
    // consultable en base. L'inverse perdrait la demande.
    try {
      await this.databaseService.db.insert(siteContactTable).values({
        email,
        formulaire,
      });
    } catch (error) {
      // Une trace manquante ne justifie pas de perdre la demande : on continue
      // vers l'envoi, qui est ce que l'utilisateur attend.
      this.logger.error(
        `Échec de l'enregistrement d'un message de contact : ${getErrorMessage(
          error
        )}`
      );
    }

    const html = await render(
      SendContactMessageEmail({
        objet,
        objetLabel: OBJET_LABELS[objet],
        prenom,
        nom,
        email,
        tel,
        message,
        sendToEmail: to,
      })
    );

    const sendResult = await this.emailService.sendEmail({
      to,
      // Sujet inchangé depuis l'edge function : des filtres de boîte de
      // réception peuvent s'appuyer dessus.
      subject: `Demande de contact depuis le site public - ${objet}`,
      html,
      // `from` est imposé par SMTP_FROM ; sans `replyTo`, la boîte de contact
      // ne peut pas répondre directement au demandeur.
      replyTo: email,
    });

    if (!sendResult.success) {
      this.logger.error(
        `Échec de l'envoi du message de contact vers ${to} : ${sendResult.error.errorMessage}`
      );
      return failure(SendContactMessageErrorEnum.SEND_CONTACT_EMAIL_ERROR);
    }

    return success(undefined);
  }
}
