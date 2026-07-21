import { Injectable, Logger } from '@nestjs/common';
import { invitationTable } from '@tet/backend/collectivites/membres/invitation.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import {
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { render } from '@react-email/components';
import { eq } from 'drizzle-orm';
import { SendInvitationEmail } from './send-invitation.email';
import {
  SendInvitationError,
  SendInvitationErrorEnum,
} from './send-invitation.errors';
import { SendInvitationInput } from './send-invitation.input';

type ResolvedInvitationMail = {
  to: string;
  collectiviteId: number;
  collectiviteNom: string;
  invitationUrl: string;
  urlType: 'invitation' | 'rattachement';
};

@Injectable()
export class SendInvitationService {
  private readonly logger = new Logger(SendInvitationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly listUsersService: ListUsersService,
    private readonly emailService: EmailService,
    private readonly configurationService: ConfigurationService
  ) {}

  async send(
    input: SendInvitationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<{ messageId: string }, SendInvitationError | CommonError>> {
    const resolved = await this.resolveMailPayload(input);
    if (!resolved.success) {
      return resolved;
    }

    const { to, collectiviteId, collectiviteNom, invitationUrl, urlType } =
      resolved.data;

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.MEMBRES.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(SendInvitationErrorEnum.UNAUTHORIZED);
    }

    const sender = await this.listUsersService.getUserBasicInfo({
      userId: user.id,
    });
    if (!sender?.prenom || !sender?.nom || !sender.email) {
      return failure(SendInvitationErrorEnum.INCOMPLETE_SENDER_PROFILE);
    }

    const subject = `Invitation de ${sender.prenom} ${sender.nom} à rejoindre ${collectiviteNom} sur Territoires en Transitions`;
    const html = await render(
      SendInvitationEmail({
        sendToEmail: to,
        senderPrenom: sender.prenom,
        senderNom: sender.nom,
        senderEmail: sender.email,
        collectiviteNom,
        invitationUrl,
        urlType,
      })
    );

    const sendResult = await this.emailService.sendEmail({
      to,
      subject,
      html,
    });

    if (!sendResult.success) {
      this.logger.error(
        `Échec envoi invitation à ${to}: ${sendResult.error.errorMessage}`
      );
      return failure(SendInvitationErrorEnum.SEND_EMAIL_ERROR);
    }

    this.logger.log(
      `Invitation envoyée à ${to} (messageId ${sendResult.data.messageId})`
    );
    return success({ messageId: sendResult.data.messageId });
  }

  private async resolveMailPayload(
    input: SendInvitationInput
  ): Promise<
    Result<ResolvedInvitationMail, SendInvitationError | CommonError>
  > {
    const appUrl = this.configurationService.get('APP_URL').replace(/\/+$/, '');

    if (input.urlType === 'invitation') {
      const [invitation] = await this.databaseService.db
        .select({
          email: invitationTable.email,
          collectiviteId: invitationTable.collectiviteId,
          pending: invitationTable.pending,
          active: invitationTable.active,
          collectiviteNom: collectiviteTable.nom,
        })
        .from(invitationTable)
        .innerJoin(
          collectiviteTable,
          eq(collectiviteTable.id, invitationTable.collectiviteId)
        )
        .where(eq(invitationTable.id, input.invitationId))
        .limit(1);

      if (!invitation) {
        return failure(SendInvitationErrorEnum.NOT_FOUND);
      }

      if (!invitation.pending || invitation.active === false) {
        return failure(SendInvitationErrorEnum.INVITATION_NOT_PENDING);
      }

      return success({
        to: invitation.email,
        collectiviteId: invitation.collectiviteId,
        collectiviteNom: invitation.collectiviteNom,
        invitationUrl: `${appUrl}/invitation/${input.invitationId}`,
        urlType: 'invitation',
      });
    }

    const [collectivite] = await this.databaseService.db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, input.collectiviteId))
      .limit(1);

    if (!collectivite) {
      return failure(SendInvitationErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    return success({
      to: input.to.toLowerCase(),
      collectiviteId: collectivite.id,
      collectiviteNom: collectivite.nom,
      invitationUrl: `${appUrl}/collectivite/${collectivite.id}/accueil`,
      urlType: 'rattachement',
    });
  }
}
