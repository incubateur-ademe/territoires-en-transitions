import { Injectable } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { UserInfo } from '@tet/domain/users';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import { utilisateurSupportTable } from '../../authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '../../authorizations/roles/utilisateur-verifie.table';

@Injectable()
export class ListUsersRepository {
  private readonly db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async listUserInfosBy({
    userId,
    emails,
  }: {
    userId?: string;
    emails?: string[];
  }): Promise<UserInfo[]> {
    const where = [
      userId ? eq(dcpTable.id, userId) : undefined,
      emails ? inArray(dcpTable.email, emails) : undefined,
    ];

    return this.listUsersInfoBy(where);
  }

  private async listUsersInfoBy(where: (SQLWrapper | SQL | undefined)[]) {
    return this.db
      .select({
        id: dcpTable.id,
        email: dcpTable.email,
        nom: dcpTable.nom,
        prenom: dcpTable.prenom,
        telephone: dcpTable.telephone,
        cguAccepteesLe: dcpTable.cguAccepteesLe,
      })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .leftJoin(
        utilisateurSupportTable,
        eq(utilisateurSupportTable.userId, authUsersTable.id)
      )
      .leftJoin(
        utilisateurVerifieTable,
        eq(utilisateurVerifieTable.userId, authUsersTable.id)
      )
      .where(and(...where));
  }
}
