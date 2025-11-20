import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserWithCollectiviteAccessesSchema } from '@tet/domain/users';
import { createZodDto } from 'nestjs-zod';

class UserWithCollectiviteAccessesClass extends createZodDto(
  UserWithCollectiviteAccessesSchema
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
      "Les informations de l'utilisateur connecté, y compris ses permissions.",
    type: UserWithCollectiviteAccessesClass,
  })
  async getUserWithCollectiviteAccesses(
    @TokenInfo() user: AuthUser
  ): Promise<UserWithCollectiviteAccessesClass> {
    const userInfo = await this.usersService.getUserWithAccesses(user);
    return userInfo.user;
  }
}
