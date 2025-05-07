import {
  AuthUser,
  authUsersTable,
  dcpTable,
} from '@/backend/auth/index-domain';
import { DatabaseService } from '@/backend/utils';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import { isNil, pick } from 'es-toolkit';
import z from 'zod';
import { RoleService } from '../authorizations/roles/role.service';
import { utilisateurSupportTable } from '../authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '../authorizations/roles/utilisateur-verifie.table';
import { UserInfoResponseType } from './user-info.response';

@Injectable()
export class UsersService {
  private db = this.database.db;
  constructor(
    private readonly database: DatabaseService,
    private readonly roleService: RoleService
  ) {}

  readonly getInputSchema = z.object({
    email: z.string(),
  });

  async getTokenUserWithPermissions(tokenInfo: AuthUser) {
    if (tokenInfo.role !== 'authenticated' || isNil(tokenInfo.id)) {
      throw new UnauthorizedException(
        'Uniquement accessible pour utilisateurs authentifiés'
      );
    }

    const userInfo: UserInfoResponseType =
      await this.getUserWithPermissionsById(tokenInfo.id);
    return { user: userInfo };
  }

  async getUserWithPermissions(
    { email }: z.infer<typeof this.getInputSchema>,
    tokenInfo: AuthUser
  ) {
    if (tokenInfo.role !== 'service_role') {
      throw new UnauthorizedException(
        'Uniquement accessible pour les comptes de service'
      );
    }

    let userInfo: UserInfoResponseType | null = null;
    if (email) {
      userInfo = await this.getUserWithPermissionsByEmail(email);
    }
    return { user: userInfo };
  }

  async getUserInfoByEmail(email: string) {
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
        userId: dcpTable.userId,
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

  async usersInfoByEmail(
    { emails }: z.infer<typeof this.getAllInputSchema>,
    user: AuthUser
  ) {
    if (user.role !== 'service_role') {
      throw new UnauthorizedException(
        'Uniquement accessible pour les comptes de service'
      );
    }
    return this.getUsersInfoByEmail(emails);
  }

  async getUserWithPermissionsById(userId: string) {
    const userInfo: UserInfoResponseType | null = await this.getUserInfoById(
      userId
    );

    if (!userInfo) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    const permissions = (
      await this.roleService.getPermissions({
        userId: userInfo.userId,
        addCollectiviteNom: true,
      })
    ).map((access) =>
      pick(access, ['collectiviteId', 'isActive', 'niveau', 'collectiviteNom'])
    );

    userInfo.permissions = permissions;

    return userInfo;
  }

  async getUserWithPermissionsByEmail(email: string) {
    const userInfo: UserInfoResponseType | null = await this.getUserInfoByEmail(
      email
    );

    if (!userInfo) {
      return null;
    }

    const permissions = (
      await this.roleService.getPermissions({
        userId: userInfo.userId,
        addCollectiviteNom: true,
      })
    ).map((access) =>
      pick(access, ['collectiviteId', 'isActive', 'niveau', 'collectiviteNom'])
    );

    userInfo.permissions = permissions;

    return userInfo;
  }
}
