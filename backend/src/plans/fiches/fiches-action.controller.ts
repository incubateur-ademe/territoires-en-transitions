import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import FichesActionUpdateService from './fiches-action-update.service';
import { editFicheRequestSchema } from './shared/edit-fiche.request';

export class UpdateFicheActionRequestClass extends createZodDto(
  editFicheRequestSchema.refine(
    (schema) => Object.keys(schema).length > 0,
    'Body cannot be empty'
  )
) {}

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly fichesActionUpdateService: FichesActionUpdateService
  ) {}

  @Put(':id')
  @ApiOkResponse({
    type: UpdateFicheActionRequestClass,
    description: "Mise à jour d'une fiche action",
  })
  async updateFicheAction(
    @Param('id') id: number,
    @Body()
    body: UpdateFicheActionRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return await this.fichesActionUpdateService.updateFicheAction(
      id,
      body,
      tokenInfo
    );
  }
}
