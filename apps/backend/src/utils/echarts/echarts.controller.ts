import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { EchartsService } from '@tet/backend/utils/echarts/echarts.service';
import { Body, Controller, Next, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { chartRenderRequestSchema } from '@tet/domain/utils';
import type { NextFunction, Response } from 'express';
import { createZodDto } from 'nestjs-zod';

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
