import { createZodDto } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { getIndicateursValeursResponseSchema } from '../models/get-indicateurs.response';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../models/upsert-indicateurs-valeurs.request';
import IndicateursService from '../services/indicateurs.service';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { getIndicateursValeursRequestSchema } from '../models/get-indicateurs.request';
import ExportIndicateursService from '../services/export-indicateurs.service';
import { exportIndicateursRequestSchema } from '../models/export-indicateurs.request';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class GetIndicateursValeursRequestClass extends createZodDto(
  getIndicateursValeursRequestSchema
) {}

class GetIndicateursValeursResponseClass extends createZodDto(
  getIndicateursValeursResponseSchema
) {}

class GetExportIndicateursRequestClass extends createZodDto(
  exportIndicateursRequestSchema
) {}

@ApiTags('Indicateurs')
@Controller('indicateurs')
export class IndicateursController {
  private readonly logger = new Logger(IndicateursController.name);

  constructor(
    private readonly indicateurService: IndicateursService,
    private readonly exportService: ExportIndicateursService
  ) {}

  @Get()
  @ApiResponse({ type: GetIndicateursValeursResponseClass })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.indicateurService.getIndicateurValeursGroupees(
      request,
      tokenInfo
    );
  }

  @Post()
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs =
      await this.indicateurService.upsertIndicateurValeurs(
        request.valeurs,
        tokenInfo
      );
    return { valeurs: upsertedValeurs };
  }

  @Post('xlsx')
  @ApiResponse({
    type: Response,
  })
  async exportIndicateurs(
    @Body() request: GetExportIndicateursRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
    @Res() res: Response
  ) {
    const result = await this.exportService.exportXLSX(request, tokenInfo);
    if (!result) {
      res.status(404).send('Données non trouvées');
      return;
    }

    const { buffer, filename } = result;
    res.set(
      'Content-Disposition',
      `attachment; filename="${encodeURI(filename)}"`
    );
    res.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(buffer);
  }
}
