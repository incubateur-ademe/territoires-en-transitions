import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { ReferentielId } from '../models/referentiel-id.enum';
import { getReferentielResponseSchema } from './get-referentiel.response';
import { GetReferentielService } from './get-referentiel.service';

class GetReferentielResponseClass extends createZodDto(
  getReferentielResponseSchema
) {}

@ApiTags('Referentiels')
@Controller('referentiels')
export class GetReferentielController {
  private readonly logger = new Logger(GetReferentielController.name);

  constructor(private readonly getReferentielService: GetReferentielService) {}

  @AllowPublicAccess()
  @Get(':referentiel_id')
  @ApiResponse({ type: GetReferentielResponseClass })
  async getReferentiel(
    @Param('referentiel_id') referentielId: ReferentielId
  ): Promise<GetReferentielResponseClass> {
    return this.getReferentielService.getReferentielTree(referentielId, true);
  }
}
