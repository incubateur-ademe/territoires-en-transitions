import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  CollectiviteIdParamDto,
  PlanIdParamDto,
} from './dto/partner-query.dto';
import {
  GetPlanResponseDto,
  ListPlansResponseDto,
} from './dto/partner-plan.dto';
import { PartnerPermissionGuard } from './partner-permission.guard';
import { PartnerPlansService } from './partner-plans.service';

@ApiTags('API Partenaires - Plans')
@ApiBearerAuth()
@UseGuards(PartnerPermissionGuard)
@Controller('collectivites/:collectiviteId/plans')
export class PartnerPlansController {
  constructor(private readonly partnerPlansService: PartnerPlansService) {}

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get()
  @ApiOperation({
    summary: "Liste les plans d'action d'une collectivité.",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des plans de la collectivité.",
    type: ListPlansResponseDto,
  })
  async listPlans(
    @Param() params: CollectiviteIdParamDto,
    @TokenInfo() _tokenInfo: AuthUser
  ) {
    return this.partnerPlansService.listPlans(params.collectiviteId);
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get(':planId')
  @ApiOperation({
    summary:
      "Détail d'un plan avec arborescence complète des axes et ficheIds.",
  })
  @ApiResponse({
    status: 200,
    description: "Détail du plan avec arborescence.",
    type: GetPlanResponseDto,
  })
  async getPlan(
    @Param() params: PlanIdParamDto,
    @TokenInfo() _tokenInfo: AuthUser
  ) {
    return this.partnerPlansService.getPlan(
      params.collectiviteId,
      params.planId
    );
  }
}
