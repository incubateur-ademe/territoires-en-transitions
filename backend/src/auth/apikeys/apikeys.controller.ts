import { ApikeysService } from '@/backend/auth/apikeys/apikeys.service';
import { generateTokenRequestSchema } from '@/backend/auth/apikeys/generate-token.request';
import { AllowPublicAccess } from '@/backend/auth/decorators/allow-public-access.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

class GenerateTokenRequestClass extends createZodDto(
  generateTokenRequestSchema
) {}

@ApiTags('Authentification')
@Controller('oauth')
export class ApikeysController {
  constructor(private readonly apikeysService: ApikeysService) {}

  @AllowPublicAccess()
  @Post('token')
  async generateToken(
    @Body() request: GenerateTokenRequestClass,
    @Headers('host') host: string
  ) {
    return this.apikeysService.generateToken(request, host);
  }
}
