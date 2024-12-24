import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { exportIndicateursRequestSchema } from '../shared/models/export-indicateurs.request';
import ExportIndicateursService from './export-indicateurs.service';

class GetExportIndicateursRequestClass extends createZodDto(
  exportIndicateursRequestSchema
) {}

@ApiTags('Indicateurs')
@Controller('indicateurs')
export class ExportIndicateursController {
  constructor(private readonly exportService: ExportIndicateursService) {}

  @Post('xlsx')
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
