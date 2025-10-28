import { authUsersTable } from '@/backend/users/models/auth-users.table';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import z from 'zod';
import { RoleService } from '../../authorizations/roles/role.service';
import { utilisateurSupportTable } from '../../authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '../../authorizations/roles/utilisateur-verifie.table';
import { UserInfoResponseType } from './user-info.response';

@Injectable()
export class ListUsersService {
  private db = this.database.db;
  constructor(
    private readonly database: DatabaseService,
    private readonly roleService: RoleService
  ) {}

  readonly getInputSchema = z.object({
    email: z.string(),
  });

  async getUserWithAccesses(user: AuthUser) {
    if (user.role !== 'authenticated' || isNil(user.id)) {
      throw new ForbiddenException(
        'Uniquement accessible pour utilisateurs authentifiés'
      );
    }

    const userInfo: UserInfoResponseType = await this.getUserWithAccessesById(
      user.id
    );
    return { user: userInfo };
  }

  private async getUserInfoByEmail(email: string) {
    const users = await this.getUsersInfoByEmail([email]);
    return users?.[0] || null;
  }

  async getUserInfoById(userId: string) {
    const users = await this.getUsersInfoBy([eq(dcpTable.userId, userId)]);
    return users?.[0] || null;
  }

  private async getUsersInfoByEmail(emails: string[]) {
    return this.getUsersInfoBy([inArray(dcpTable.email, emails)]);
  }

  private async getUsersInfoBy(where: (SQLWrapper | SQL)[]) {
    return this.db
      .select({
        id: dcpTable.userId,
        email: dcpTable.email,
        nom: dcpTable.nom,
        prenom: dcpTable.prenom,
        telephone: dcpTable.telephone,
        isVerified: utilisateurVerifieTable.verifie,
        isSupport: utilisateurSupportTable.support,
      })
      .from(authUsersTable)
      .innerJoin(dcpTable, eq(dcpTable.userId, authUsersTable.id))
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

  readonly getAllInputSchema = z.object({
    emails: z.string().array(),
  });

  async usersInfoByEmail({ emails }: z.infer<typeof this.getAllInputSchema>) {
    return this.getUsersInfoByEmail(emails);
  }

  private async getUserWithAccessesById(userId: string) {
    const userInfo: UserInfoResponseType | null = await this.getUserInfoById(
      userId
    );

    if (!userInfo) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    const collectiviteAccesses = await this.roleService.getCollectiviteAccesses(
      userInfo.id
    );

    userInfo.collectivites = collectiviteAccesses;

    return userInfo;
  }

  async getUserWithAccessesByEmail(email: string) {
    const userInfo: UserInfoResponseType | null = await this.getUserInfoByEmail(
      email
    );

    if (!userInfo) {
      return null;
    }

    const collectiviteAccesses = await this.roleService.getCollectiviteAccesses(
      userInfo.id
    );

    userInfo.collectivites = collectiviteAccesses;

    return { user: userInfo };
  }
}
