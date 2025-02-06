import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { getReferentielResponseSchema } from '../get-referentiel/get-referentiel.response';
import { ReferentielId } from '../models/referentiel-id.enum';
import ImportReferentielService from './import-referentiel.service';

class GetReferentielResponseClass extends createZodDto(
  getReferentielResponseSchema
) {}

@ApiTags('Referentiels')
@Controller('referentiels')
export class ImportReferentielController {
  private readonly logger = new Logger(ImportReferentielController.name);

  constructor(private readonly importService: ImportReferentielService) {}

  @AllowAnonymousAccess()
  @Get(':referentiel_id/import')
  @ApiResponse({ type: GetReferentielResponseClass })
  async importReferentiel(
    @Param('referentiel_id') referentielId: ReferentielId
  ): Promise<GetReferentielResponseClass> {
    return this.importService.importReferentiel(referentielId);
  }
}
