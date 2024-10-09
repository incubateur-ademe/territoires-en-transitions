import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { getReferentielResponseSchema } from '../models/get-referentiel.response';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsService from '../services/referentiels.service';

class GetReferentielResponseClass extends createZodDto(
  getReferentielResponseSchema
) {}

@ApiTags('Referentiels')
@Controller('referentiels')
export class ReferentielsController {
  private readonly logger = new Logger(ReferentielsController.name);

  constructor(private readonly referentielsService: ReferentielsService) {}

  @AllowPublicAccess()
  @Get(':referentiel_id')
  @ApiResponse({ type: GetReferentielResponseClass })
  async getReferentiel(
    @Param('referentiel_id') referentielId: ReferentielType,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<GetReferentielResponseClass> {
    return this.referentielsService.getReferentiel(referentielId, true);
  }
}
