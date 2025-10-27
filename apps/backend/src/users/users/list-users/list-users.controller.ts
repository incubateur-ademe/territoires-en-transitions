import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthUser } from '@/backend/users/models/auth.models';
import { ListUsersService } from '@/backend/users/users/list-users/list-users.service';
import { userInfoResponseSchema } from '@/backend/users/users/list-users/user-info.response';
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

class UserInfoResponseClass extends createZodDto(userInfoResponseSchema) {}

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
    type: UserInfoResponseClass,
  })
  async getUserInfoWithPermissions(
    @TokenInfo() user: AuthUser
  ): Promise<UserInfoResponseClass> {
    const userInfo = await this.usersService.getTokenUserWithPermissions(user);
    return userInfo.user;
  }
}
