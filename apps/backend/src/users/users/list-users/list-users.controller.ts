import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthUser } from '@/backend/users/models/auth.models';
import { ListUsersService } from '@/backend/users/users/list-users/list-users.service';
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { UserWithCollectiviteAccessesSchema } from './user-with-collectivite-accesses.dto';

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
