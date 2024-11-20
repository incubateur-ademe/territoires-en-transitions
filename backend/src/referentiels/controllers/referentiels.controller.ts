import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
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
    @Param('referentiel_id') referentielId: ReferentielType
  ): Promise<GetReferentielResponseClass> {
    return this.referentielsService.getReferentiel(referentielId, true);
  }

  @AllowAnonymousAccess()
  @Get(':referentiel_id/import')
  @ApiResponse({ type: GetReferentielResponseClass })
  async importReferentiel(
    @Param('referentiel_id') referentielId: ReferentielType
  ): Promise<GetReferentielResponseClass> {
    return this.referentielsService.importReferentiel(referentielId);
  }
}
