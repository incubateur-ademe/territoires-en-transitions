import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { reportGenerationRequestSchema } from './generate-report.request';
import { GenerateReportsService } from './generate-reports.service';

class ReportGenerationRequestClass extends createZodDto(
  reportGenerationRequestSchema
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
    @Body() request: ReportGenerationRequestClass,
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
