import { ApikeysService } from '@/backend/users/apikeys/apikeys.service';
import {
  GenerateTokenRequest,
  generateTokenRequestSchema,
  generateTokenRequestWithOptionalClientIdClientSecretSchema,
} from '@/backend/users/apikeys/generate-token.request';
import { AllowPublicAccess } from '@/backend/users/decorators/allow-public-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FormDataRequest } from 'nestjs-form-data';

class GenerateTokenRequestClass extends createZodDto(
  generateTokenRequestWithOptionalClientIdClientSecretSchema
) {}

@ApiTags('Authentification & permissions')
@Controller('oauth')
export class ApikeysController {
  constructor(private readonly apikeysService: ApikeysService) {}

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @AllowPublicAccess()
  @FormDataRequest()
  @Post('token')
  @ApiOperation({
    summary:
      "Préalable: récupération d'un bearer token à partir du couple client id / client secret.",
  })
  async generateToken(
    @Body() request: GenerateTokenRequestClass,
    @Headers() headers: { host: string; authorization?: string }
  ) {
    // swagger ui is sending the client_id and client_secret in the authorization header and not in the body
    if (headers.authorization && !request.client_id) {
      const clientIdSecret = headers.authorization.split(' ')[1];
      const [clientId, clientSecret] = Buffer.from(clientIdSecret, 'base64')
        .toString('utf-8')
        .split(':');
      request.client_id = clientId;
      request.client_secret = clientSecret;
    }

    generateTokenRequestSchema.parse(request);

    return this.apikeysService.generateToken(
      request as GenerateTokenRequest,
      headers.host
    );
  }
}
