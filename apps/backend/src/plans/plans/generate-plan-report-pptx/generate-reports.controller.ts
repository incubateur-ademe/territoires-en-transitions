import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { reportGenerationInputSchema } from '@tet/domain/plans';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { GenerateReportsService } from './generate-reports.service';

class ReportGenerationInputClass extends createZodDto(
  reportGenerationInputSchema
) {}

@ApiExcludeController()
@ApiTags("Plan d'action")
@Controller('reports')
export class GenerateReportsController {
  constructor(
    private readonly generateReportsService: GenerateReportsService
  ) {}

  @Post('generate')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiOperation({
    summary: 'Generate a plan report',
    description: 'Generate a report for a specific plan of a collectivité',
  })
  async generatePlanReport(
    @Body() request: ReportGenerationInputClass,
    @Res() res: Response,
    @TokenInfo() user: AuthenticatedUser
  ) {
    return await this.generateReportsService.generateAndDownloadPlanReport(
      request,
      user,
      res
    );
  }
}
