import { Injectable, Logger } from '@nestjs/common';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { CollectiviteRole } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { ListAdminContactsInput } from './list-admin-contacts.input';
import { AdminContact } from './list-admin-contacts.output';

@Injectable()
export class ListAdminContactsService {
  private readonly logger = new Logger(ListAdminContactsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Liste les administrateurs actifs d'une collectivité, pour qu'un
   * utilisateur qui souhaite la rejoindre puisse les contacter. Accessible à
   * tout utilisateur connecté, sans rôle sur la collectivité (c'est
   * précisément le cas d'usage).
   */
  async list({
    collectiviteId,
  }: ListAdminContactsInput): Promise<Result<AdminContact[], CommonError>> {
    try {
      const contacts = await this.databaseService.db
        .select({
          prenom: dcpTable.prenom,
          nom: dcpTable.nom,
          email: dcpTable.email,
        })
        .from(utilisateurCollectiviteAccessTable)
        .innerJoin(
          dcpTable,
          eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
        )
        .where(
          and(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectiviteId
            ),
            eq(utilisateurCollectiviteAccessTable.isActive, true),
            eq(utilisateurCollectiviteAccessTable.role, CollectiviteRole.ADMIN)
          )
        );

      return success(contacts);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la lecture des administrateurs de la collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
