import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { ReconcileParticipationScoreService } from './reconcile-participation-score.service';

@ApiTags('Indicateurs')
@ApiExcludeController()
@Controller('indicateurs/definitions')
export class ReconcileParticipationScoreController {
  constructor(
    private readonly reconcileParticipationScoreService: ReconcileParticipationScoreService
  ) {}

  @AllowAnonymousAccess()
  @Get('reconcile-participation-score')
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @ApiResponse({ type: Object })
  async reconcileParticipationScore() {
    return this.reconcileParticipationScoreService.reconcile();
  }
}
