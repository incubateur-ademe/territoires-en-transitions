import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { userWithRolesAndPermissionsSchema } from '@tet/domain/users';
import { createZodDto } from 'nestjs-zod';

class UserWithRolesAndPermissionsClass extends createZodDto(
  userWithRolesAndPermissionsSchema
) {}

@ApiBearerAuth()
@ApiTags('Authentification & permissions')
@Controller('utilisateur')
export class ListUsersController {
  constructor(private readonly usersService: ListUsersService) {}

  @Get('')
  @ApiOperation({
    summary:
      "Récupération des informations de l'utilisateur connecté, y compris ses permissions.",
  })
  @ApiOkResponse({
    description:
      "Les informations de l'utilisateur connecté, y compris ses rôles et permissions.",
    type: UserWithRolesAndPermissionsClass,
  })
  async getUserWithRolesAndPermissions(
    @TokenInfo() user: AuthUser
  ): Promise<UserWithRolesAndPermissionsClass> {
    if (!user.id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const userInfo = await this.usersService.getUserWithRolesAndPermissionsBy({
      userId: user.id,
    });
    return userInfo;
  }
}
