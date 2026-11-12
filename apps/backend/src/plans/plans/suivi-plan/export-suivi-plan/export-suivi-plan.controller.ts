import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { getPlanErrorConfig } from '../../get-plan/get-plan.errors';
import {
  getEvolutionStatutsInputSchema,
  type GetEvolutionStatutsInput,
} from '../get-evolution-statuts/get-evolution-statuts.input';
import {
  suiviPlanBlocInputSchema,
  type SuiviPlanBlocInput,
} from '../suivi-plan.input';
import {
  ExportSuiviPlanService,
  SuiviPlanExport,
} from './export-suivi-plan.service';

@ApiExcludeController()
@ApiTags('Plan')
@Controller('plan/suivi')
export class ExportSuiviPlanController {
  constructor(private readonly service: ExportSuiviPlanService) {}

  private readonly getResultDataOrThrowError =
    createControllerErrorHandler(getPlanErrorConfig);

  @Post('vue-ensemble/export')
  @ApiUsage([ApiUsageEnum.APP])
  async exportVueEnsemble(
    @Body(new ZodValidationPipe(suiviPlanBlocInputSchema))
    input: SuiviPlanBlocInput,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.service.exportVueEnsemble(input, { user });
    this.send(res, this.getResultDataOrThrowError(result));
  }

  @Post('avancement-par-axe/export')
  @ApiUsage([ApiUsageEnum.APP])
  async exportAvancementParAxe(
    @Body(new ZodValidationPipe(suiviPlanBlocInputSchema))
    input: SuiviPlanBlocInput,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.service.exportAvancementParAxe(input, { user });
    this.send(res, this.getResultDataOrThrowError(result));
  }

  @Post('evolution-statuts/export')
  @ApiUsage([ApiUsageEnum.APP])
  async exportEvolutionStatuts(
    @Body(new ZodValidationPipe(getEvolutionStatutsInputSchema))
    input: GetEvolutionStatutsInput,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.service.exportEvolutionStatuts(input, { user });
    this.send(res, this.getResultDataOrThrowError(result));
  }

  private send(res: Response, { buffer, filename }: SuiviPlanExport) {
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
