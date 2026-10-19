import type { z } from 'zod';
import { ApikeysService } from '@tet/backend/users/apikeys/apikeys.service';
import {
  generateTokenRequestSchema,
  generateTokenRequestWithOptionalClientIdClientSecretSchema,
} from '@tet/backend/users/apikeys/generate-token.request';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import {
  Body,
  Controller,
  Headers,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

type GenerateTokenRequestBody = z.infer<
  typeof generateTokenRequestWithOptionalClientIdClientSecretSchema
>;

@ApiTags('Authentification & permissions')
@Controller('oauth')
export class ApikeysController {
  constructor(private readonly apikeysService: ApikeysService) {}

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @AllowPublicAccess()
  @UseInterceptors(NoFilesInterceptor())
  @Post('token')
  @ApiOperation({
    summary:
      "Préalable: récupération d'un bearer token à partir du couple client id / client secret.",
  })
  async generateToken(
    @Body({
      schema: generateTokenRequestWithOptionalClientIdClientSecretSchema.meta({
        id: 'GenerateTokenRequestClass',
      }),
    })
    request: GenerateTokenRequestBody,
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

    const validatedRequest = generateTokenRequestSchema.parse(request);

    return this.apikeysService.generateToken(validatedRequest, headers.host);
  }
}
