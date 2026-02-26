import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Invitation } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { invitationTable } from '../invitation.table';
import { ListPendingInvitationsInput } from './list-pending-invitations.input';

@Injectable()
export class ListPendingInvitationsService {
  private readonly logger = new Logger(ListPendingInvitationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /** Liste les invitations en attente pour la collectivité */
  async list(
    { collectiviteId }: ListPendingInvitationsInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<Invitation[]> {
    this.logger.log(
      `Récupération des invitations en attente pour la collectivité ${collectiviteId}`
    );

    if (user) {
      await this.permissionService.isAllowed(
        user,
        'collectivites.membres.read',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    const invitations = await (tx ?? this.databaseService.db)
      .select({
        id: invitationTable.id,
        email: invitationTable.email,
        role: invitationTable.role,
      })
      .from(invitationTable)
      .where(
        and(
          eq(invitationTable.collectiviteId, collectiviteId),
          eq(invitationTable.pending, true)
        )
      ).orderBy(sql`
      ${invitationTable.email} collate numeric_with_case_and_accent_insensitive`);

    return invitations;
  }
}
