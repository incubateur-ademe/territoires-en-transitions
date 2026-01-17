import { Injectable, NotFoundException } from '@nestjs/common';
import { Dcp, UserInfo, UserWithRolesAndPermissions } from '@tet/domain/users';
import { pick } from 'es-toolkit';
import { GetUserRolesAndPermissionsService } from '../../authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { ListUsersRepository } from './list-users.repository';

export type BasicUserInfo = Pick<Dcp, 'id' | 'email' | 'nom' | 'prenom'>;

type EitherUserIdOrEmail =
  | { userId: string; email?: undefined }
  | {
      userId?: undefined;
      email: string;
    };

@Injectable()
export class ListUsersService {
  constructor(
    private readonly listUsersRepository: ListUsersRepository,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService
  ) {}

  async getUserBasicInfo({
    userId,
  }: {
    userId: string;
  }): Promise<BasicUserInfo | null> {
    const [user] = await this.listUsersRepository.listUserInfosBy({ userId });

    if (!user) {
      return null;
    }

    return pick(user, ['id', 'email', 'nom', 'prenom']);
  }

  async getUserWithRolesAndPermissionsBy({
    userId,
    email,
  }: EitherUserIdOrEmail): Promise<UserWithRolesAndPermissions> {
    const [userInfo] = await this.listUsersRepository.listUserInfosBy(
      userId !== undefined ? { userId } : { emails: [email] }
    );

    if (!userInfo) {
      throw new NotFoundException(`Utilisateur ${userId || email} non trouvé`);
    }

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: userInfo.id,
      });

    if (!userPermissionsResult.success) {
      throw new NotFoundException(`Utilisateur ${userId || email} non trouvé`);
    }

    return {
      ...userInfo,
      ...userPermissionsResult.data,
    };
  }

  async listUsersInfoBy({ emails }: { emails: string[] }): Promise<UserInfo[]> {
    return this.listUsersRepository.listUserInfosBy({ emails });
  }
}
