import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';
import { exportIndicateursRequestSchema } from './export-indicateurs.request';
import ExportIndicateursService from './export-indicateurs.service';

class GetExportIndicateursRequestClass extends createZodDto(
  exportIndicateursRequestSchema
) {}

@ApiTags('Indicateurs')
@ApiExcludeController()
@Controller('indicateur-definitions')
export class ExportIndicateursController {
  constructor(private readonly exportService: ExportIndicateursService) {}

  @Post('xlsx')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiResponse({
    type: Response,
  })
  async exportIndicateurs(
    @Body() request: GetExportIndicateursRequestClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const result = await this.exportService.exportXLSX(request, user);
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
