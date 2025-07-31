import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { chartRenderRequestSchema } from '@/backend/utils/echarts/chart-render.request';
import { EchartsService } from '@/backend/utils/echarts/echarts.service';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Next, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';

class ChartRenderRequestClass extends createZodDto(chartRenderRequestSchema) {}

@ApiTags('Application')
@ApiExcludeController()
@Controller()
export class EchartsController {
  constructor(private readonly echartsService: EchartsService) {}

  @AllowAnonymousAccess()
  @Post('charts/render')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiOkResponse({
    description: 'The rendered chart either in svg or png format',
  })
  async renderChart(
    @Body() request: ChartRenderRequestClass,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    return this.echartsService.renderChart(request, res, next);
  }
}
