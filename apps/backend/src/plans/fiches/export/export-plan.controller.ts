import type { z } from 'zod';
import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  exportRequestSchema,
  ExportService,
} from '@tet/backend/plans/fiches/export/export.service';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import type { Response } from 'express';

type GetExportRequest = z.infer<typeof exportRequestSchema>;

@ApiExcludeController()
@ApiTags('Plan')
@ApiBearerAuth()
@Controller('plan')
export class ExportPlanController {
  constructor(private readonly exportService: ExportService) {}

  @Post('export')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiResponse({
    type: Response,
  })
  async exportPlan(
    @Body({ schema: exportRequestSchema.meta({ id: 'GetExportRequestClass' }) })
    request: GetExportRequest,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.exportService.export(request, user);
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
