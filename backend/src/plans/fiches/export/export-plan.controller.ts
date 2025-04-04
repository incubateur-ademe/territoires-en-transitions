import { TokenInfo } from '@/backend/auth/decorators/token-info.decorators';
import { AuthenticatedUser } from '@/backend/auth/index-domain';
import { exportRequestSchema, ExportService } from '@/backend/plans/fiches/export/export.service';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

class GetExportRequestClass extends createZodDto(
  exportRequestSchema
) {}

@ApiTags("Plan d'action")
@Controller('plan')
export class ExportPlanController {
  constructor(private readonly exportService: ExportService) {}

  @Post('export')
  @ApiResponse({
    type: Response,
  })
  async exportIndicateurs(
    @Body() request: GetExportRequestClass,
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
