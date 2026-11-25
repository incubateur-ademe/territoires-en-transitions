import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { TokenInfo } from '../../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../../users/models/auth.models';
import { exportIndicateursErrorConfig } from './export-indicateurs.errors';
import {
  exportIndicateursRequestSchema,
  type ExportIndicateursRequestType,
} from './export-indicateurs.request';
import ExportIndicateursService from './export-indicateurs.service';

@ApiTags('Indicateurs')
@ApiExcludeController()
@Controller('indicateur-definitions')
export class ExportIndicateursController {
  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    exportIndicateursErrorConfig
  );

  constructor(private readonly exportService: ExportIndicateursService) {}

  @Post('xlsx')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiResponse({
    type: Response,
  })
  async exportIndicateurs(
    // Le schéma est une union discriminée : createZodDto ne supporte que les
    // objets, on valide donc via ZodValidationPipe au niveau du paramètre.
    @Body(new ZodValidationPipe(exportIndicateursRequestSchema))
    request: ExportIndicateursRequestType,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const exportResult = await this.exportService.exportXLSX(request, user);
    const result = this.getResultDataOrThrowError(exportResult);
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
