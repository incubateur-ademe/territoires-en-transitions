import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthUser } from '../../users/models/auth.models';
import { ApiUsageEnum } from '../../utils/api/api-usage-type.enum';
import { ApiUsage } from '../../utils/api/api-usage.decorator';
import {
  GetFicheResponseDto,
  ListFichesResponseDto,
} from './dto/partner-fiche.dto';
import {
  CollectiviteIdParamDto,
  FicheIdParamDto,
  ListFichesQueryDto,
} from './dto/partner-query.dto';
import { PartnerPermissionGuard } from './partner-permission.guard';
import { PartnerFichesService } from './partner-fiches.service';

@ApiTags('API Partenaires - Fiches')
@ApiBearerAuth()
@UseGuards(PartnerPermissionGuard)
@Controller('collectivites/:collectiviteId/fiches')
export class PartnerFichesController {
  constructor(private readonly partnerFichesService: PartnerFichesService) {}

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get()
  @ApiOperation({
    summary:
      "Liste paginée des fiches action non-restreintes d'une collectivité.",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des fiches action.',
    type: ListFichesResponseDto,
  })
  async listFiches(
    @Param() params: CollectiviteIdParamDto,
    @Query() query: ListFichesQueryDto,
    @TokenInfo() _tokenInfo: AuthUser
  ) {
    return this.partnerFichesService.listFiches(params.collectiviteId, {
      planId: query.planId,
      statut: query.statut,
      page: query.page,
      limit: query.limit,
      modifiedSince: query.modifiedSince,
    });
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get(':ficheId')
  @ApiOperation({
    summary: "Détail complet d'une fiche action non-restreinte.",
  })
  @ApiResponse({
    status: 200,
    description: 'Détail de la fiche action.',
    type: GetFicheResponseDto,
  })
  async getFiche(
    @Param() params: FicheIdParamDto,
    @TokenInfo() _tokenInfo: AuthUser
  ) {
    return this.partnerFichesService.getFiche(
      params.collectiviteId,
      params.ficheId
    );
  }
}
