import { TokenInfo } from '@/backend/auth/decorators/token-info.decorators';
import { AuthUser } from '@/backend/auth/index-domain';
import { userInfoResponseSchema } from '@/backend/auth/users/user-info.response';
import { UsersService } from '@/backend/auth/users/users.service';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

class UserInfoResponseClass extends createZodDto(userInfoResponseSchema) {}

@ApiBearerAuth()
@ApiTags('Authentification & permissions')
@Controller('utilisateur')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
